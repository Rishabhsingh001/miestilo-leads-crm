"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileUp, Link as LinkIcon } from "lucide-react"
import Papa from "papaparse"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function LeadImportDialog() {
    const [open, setOpen] = useState(false)
    const [activeTab, setActiveTab] = useState("file")
    const [file, setFile] = useState<File | null>(null)
    const [sheetUrl, setSheetUrl] = useState("")
    const [preview, setPreview] = useState<any[]>([])
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()
    const router = useRouter()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            const reader = new FileReader()
            reader.onload = (event) => {
                const text = event.target?.result as string
                const result = Papa.parse(text, { header: true, preview: 5, skipEmptyLines: true })
                setPreview(result.data)
            }
            reader.readAsText(selectedFile)
        }
    }

    // Helper to find value from multiple variations of a header
    const getValue = (row: any, keys: string[]) => {
        for (const key of keys) {
            // Case-insensitive check
            const rowKey = Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase())
            if (rowKey && row[rowKey] !== undefined && row[rowKey] !== null && String(row[rowKey]).trim() !== "") {
                return row[rowKey]
            }
        }
        return null
    }

    const cleanPhone = (val: any) => {
        if (!val) return null
        let str = String(val).trim()

        // Remove leading single quote (common Excel text artifact)
        if (str.startsWith("'")) str = str.substring(1)

        // Handle Scientific Notation (e.g., 9.87E+09)
        if (str.match(/^[0-9.]+E\+[0-9]+$/i)) {
            const num = Number(str)
            if (!isNaN(num)) {
                str = num.toLocaleString('fullwide', { useGrouping: false })
            }
        }

        // Remove .0 at end if exists (e.g. "9876543210.0")
        if (str.endsWith(".0")) str = str.slice(0, -2)

        return str
    }

    const processImport = async (data: any[]) => {
        // Get current user to set as creator/assignee
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            setUploading(false)
            toast.error("Authentication error: Could not verify user identity. Please reload.")
            return
        }

        if (data.length === 0) {
            setUploading(false)
            toast.error("No data found to import.")
            return
        }

        const emailsToCheck = new Set<string>()

        const leads = data
            .map((row: any) => {
                // Smart mapping
                const name = getValue(row, ['name', 'full name', 'fullname', 'contact name']) || 'Unknown'
                const email = getValue(row, ['email', 'e-mail', 'email address']) || ""
                const phoneRaw = getValue(row, ['phone', 'phone number', 'mobile', 'cell', 'contact number'])
                const company = getValue(row, ['company', 'company name', 'organization'])
                const country = getValue(row, ['country', 'region'])
                const city = getValue(row, ['city', 'location'])
                const profession = getValue(row, ['profession', 'job title', 'job', 'position', 'role', 'designation', 'occupation'])
                const source = getValue(row, ['source', 'lead source'])
                const notes = getValue(row, ['notes', 'note', 'comments', 'description', 'remarks', 'details', 'info'])

                const phone = cleanPhone(phoneRaw)

                if (email) emailsToCheck.add(email)

                return {
                    name,
                    email,
                    phone,
                    company,
                    country,
                    city,
                    profession,
                    notes,
                    source: source || 'Manual Import',
                    status: 'Fresh Untouched',
                    bootcamp_attendee: false,
                    days_attended: 0,
                    created_by: user.id,
                    assigned_to: user.id
                }
            })
            // Filter out rows that are completely empty or missing key info
            .filter((l: any) => l.name !== 'Unknown' || l.email || l.phone)

        // 2. Duplicate Check (Email & Phone)
        const existingEmails = new Set<string>()
        const existingPhones = new Set<string>()

        // Check Emails
        const emailArray = Array.from(emailsToCheck).filter(Boolean)
        if (emailArray.length > 0) {
            const chunkSize = 1000
            for (let i = 0; i < emailArray.length; i += chunkSize) {
                const batch = emailArray.slice(i, i + chunkSize)
                const { data: existing } = await supabase
                    .from('leads')
                    .select('email')
                    .in('email', batch)
                existing?.forEach(l => existingEmails.add(l.email))
            }
        }

        // Check Phones
        const phoneArray = leads.map((l: any) => l.phone).filter(Boolean)
        const uniquePhonesToCheck = Array.from(new Set(phoneArray))
        if (uniquePhonesToCheck.length > 0) {
            const chunkSize = 1000
            for (let i = 0; i < uniquePhonesToCheck.length; i += chunkSize) {
                const batch = uniquePhonesToCheck.slice(i, i + chunkSize) as string[]
                const { data: existing } = await supabase
                    .from('leads')
                    .select('phone')
                    .in('phone', batch)
                existing?.forEach(l => existingPhones.add(l.phone))
            }
        }

        // 3. Filter Duplicates and Count
        let duplicateEmailCount = 0
        let duplicatePhoneCount = 0

        const finalLeads = leads.filter((l: any) => {
            const isEmailDup = l.email && existingEmails.has(l.email)
            // If email is already dup, don't count as phone dup to avoid double counting same lead
            const isPhoneDup = !isEmailDup && l.phone && existingPhones.has(l.phone)

            if (isEmailDup) duplicateEmailCount++
            else if (isPhoneDup) duplicatePhoneCount++

            return !isEmailDup && !isPhoneDup
        })

        if (finalLeads.length === 0) {
            setUploading(false)
            toast.warning(`No new leads found. Skipped ${duplicateEmailCount} email duplicates and ${duplicatePhoneCount} phone duplicates.`)
            return
        }

        // Batch insert
        const { error } = await supabase.from('leads').insert(finalLeads)

        if (error) {
            toast.error("Failed to import: " + error.message)
        } else {
            toast.success(`Imported ${finalLeads.length} leads. Skipped ${duplicateEmailCount + duplicatePhoneCount} duplicates (${duplicateEmailCount} email, ${duplicatePhoneCount} phone).`)
            setOpen(false)
            setFile(null)
            setSheetUrl("")
            setPreview([])
            router.refresh()
        }
        setUploading(false)
    }

    const handleFileSubmit = async () => {
        if (!file) return
        setUploading(true)

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
            complete: async (results: any) => {
                await processImport(results.data)
            },
            error: (error: any) => {
                setUploading(false)
                toast.error("Error processing CSV: " + error.message)
            }
        })
    }

    const handleUrlSubmit = async () => {
        if (!sheetUrl) return
        setUploading(true)

        try {
            // Use our own API proxy to fetch the sheet text
            const response = await fetch(`/api/import-sheet?url=${encodeURIComponent(sheetUrl)}`)

            if (!response.ok) {
                const err = await response.json()
                throw new Error(err.error || "Failed to fetch sheet")
            }

            const csvText = await response.text()

            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                transformHeader: (header) => header.trim(),
                complete: async (results: any) => {
                    await processImport(results.data)
                },
                error: (error: any) => {
                    setUploading(false)
                    toast.error("Error parsing Sheet data: " + error.message)
                }
            })

        } catch (error: any) {
            setUploading(false)
            toast.error(error.message)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" /> Import Leads
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Import Leads</DialogTitle>
                    <DialogDescription>
                        Import leads from a CSV file or a Google Sheet link.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="file" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="file">CSV File</TabsTrigger>
                        <TabsTrigger value="url">Google Sheet</TabsTrigger>
                    </TabsList>

                    <TabsContent value="file" className="space-y-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="csv-file">CSV File</Label>
                            <Input
                                id="csv-file"
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                            />
                        </div>
                        {file && (
                            <div className="rounded-md bg-muted p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileUp className="h-4 w-4" />
                                    <span className="font-medium text-sm">{file.name}</span>
                                    <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                                </div>
                                {preview.length > 0 && (
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        <p className="font-medium text-foreground">Preview:</p>
                                        <div className="border rounded bg-background p-2 overflow-x-auto">
                                            <pre>{JSON.stringify(preview[0], null, 2)}</pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <Button onClick={handleFileSubmit} disabled={!file || uploading} className="w-full mt-4">
                            {uploading ? "Importing..." : "Import CSV"}
                        </Button>
                    </TabsContent>

                    <TabsContent value="url" className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="sheet-url">Google Sheet URL</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <LinkIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="sheet-url"
                                        placeholder="https://docs.google.com/spreadsheets/d/..."
                                        value={sheetUrl}
                                        onChange={(e) => setSheetUrl(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Paste the full URL. Ensure the sheet is <strong>public</strong> (Anyone with the link).
                            </p>
                        </div>
                        <Button onClick={handleUrlSubmit} disabled={!sheetUrl || uploading} className="w-full mt-4">
                            {uploading ? "Fetching & Importing..." : "Import from Sheet"}
                        </Button>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
