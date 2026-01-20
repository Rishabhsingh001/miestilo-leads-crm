"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowLeft, Save, Trash2, Phone, Mail, User, Building2, MapPin, Briefcase, GraduationCap } from "lucide-react"
import { logActivity } from "@/lib/logger"

import { LeadNotes } from "@/components/leads/lead-notes"

export default function LeadDetailsPage() {
    const router = useRouter()
    const params = useParams()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [lead, setLead] = useState<any>(null)
    const [currentUserId, setCurrentUserId] = useState<string>("")

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
        country: "",
        city: "",
        profession: "",
        course_name: "",
        time_in_session: "",
        days_attended: "0",
        bootcamp_attendee: "no",
        status: "",
        source: "",
        utm_source: "",
        utm_campaign: "",
        utm_medium: "",
        utm_content: "",
        utm_term: "",
        notes: "",
        assigned_to: ""
    })

    const [profiles, setProfiles] = useState<any[]>([])

    useEffect(() => {
        async function fetchData() {
            setLoading(true)

            // Fetch current user
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setCurrentUserId(user.id)

            // Fetch all profiles for assignment dropdown
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, full_name, email')
            setProfiles(profilesData || [])

            // Fetch lead
            const { data: leadData, error: leadError } = await supabase
                .from('leads')
                .select('*')
                .eq('id', params.id)
                .single()

            if (leadError) {
                toast.error("Could not fetch lead")
                router.push("/leads")
                return
            }

            setLead(leadData)
            setFormData({
                name: leadData.name || "",
                email: leadData.email || "",
                phone: leadData.phone || "",
                company: leadData.company || "",
                country: leadData.country || "",
                city: leadData.city || "",
                profession: leadData.profession || "",
                course_name: leadData.course_name || "",
                time_in_session: leadData.time_in_session || "",
                days_attended: leadData.days_attended?.toString() || "0",
                bootcamp_attendee: leadData.bootcamp_attendee ? "yes" : "no",
                status: leadData.status || "Fresh Untouched",
                source: leadData.source || "",
                utm_source: leadData.utm_source || "",
                utm_campaign: leadData.utm_campaign || "",
                utm_medium: leadData.utm_medium || "",
                utm_content: leadData.utm_content || "",
                utm_term: leadData.utm_term || "",
                notes: leadData.notes || "",
                assigned_to: leadData.assigned_to || ""
            })
            setLoading(false)
        }
        fetchData()
    }, [params.id, router, supabase])

    async function handleSave() {
        setSaving(true)

        const updates: any = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            company: formData.company,
            country: formData.country,
            city: formData.city,
            profession: formData.profession,
            status: formData.status,
            source: formData.source,
            notes: formData.notes,
            assigned_to: formData.assigned_to === 'unassigned' ? null : formData.assigned_to
        }

        const { error } = await supabase
            .from('leads')
            .update(updates)
            .eq('id', params.id)

        if (error) {
            toast.error("Failed to update lead: " + error.message)
        } else {
            // Track specific changes for logging
            if (formData.status !== lead.status) {
                await logActivity('Status Changed', 'lead', lead.id, { from: lead.status, to: formData.status })
            } else if (formData.assigned_to !== lead.assigned_to) {
                await logActivity('Lead Assigned', 'lead', lead.id, { to: formData.assigned_to })
            } else {
                await logActivity('Lead Updated', 'lead', lead.id)
            }

            toast.success("Lead updated successfully")
            // Refresh local lead state so next save compares correctly
            setLead({ ...lead, ...updates })
            router.refresh()
        }
        setSaving(false)
    }

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this lead?")) return

        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', params.id)

        if (error) {
            toast.error("Failed to delete lead. You might not have permission.")
        } else {
            toast.success("Lead deleted")
            router.push("/leads")
        }
    }

    if (loading) return <div className="p-8">Loading...</div>

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold">{lead.name}</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Content Area */}
                <div className="md:col-span-2 space-y-6">

                    {/* Basic & Contact Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Full Name</Label>
                                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-9" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Phone</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-9" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Company</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-9" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Company Name" />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Profession</Label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-9" value={formData.profession} onChange={(e) => setFormData({ ...formData, profession: e.target.value })} placeholder="e.g. Developer" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Location</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="City" />
                                    <Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} placeholder="Country" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Meeting Notes / Chat */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Conversation Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <LeadNotes leadId={lead.id} currentUserId={currentUserId} />
                        </CardContent>
                    </Card>

                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Status & Source</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Fresh Untouched">Fresh Untouched</SelectItem>
                                        <SelectItem value="Interested">Interested</SelectItem>
                                        <SelectItem value="Not Interested">Not Interested</SelectItem>
                                        <SelectItem value="Opportunity">Opportunity</SelectItem>
                                        <SelectItem value="Hot">Hot</SelectItem>
                                        <SelectItem value="DNP">DNP</SelectItem>
                                        <SelectItem value="Invalid">Invalid</SelectItem>
                                        <SelectItem value="Customer">Customer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Source</Label>
                                <Select value={formData.source} onValueChange={(val) => setFormData({ ...formData, source: val })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Google">Google</SelectItem>
                                        <SelectItem value="Facebook">Facebook</SelectItem>
                                        <SelectItem value="Instagram">Instagram</SelectItem>
                                        <SelectItem value="Referral">Referral</SelectItem>
                                        <SelectItem value="Manual">Manual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Assignment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-2">
                                <Label>Assigned To</Label>
                                <Select value={formData.assigned_to} onValueChange={(val) => setFormData({ ...formData, assigned_to: val })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Unassigned" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                        {profiles.map(profile => (
                                            <SelectItem key={profile.id} value={profile.id}>{profile.full_name || profile.email}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Timestamps</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div>
                                <p className="text-sm font-medium">{new Date(lead.created_at).toLocaleDateString()}</p>
                                <p className="text-xs text-muted-foreground">Created At</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">{new Date(lead.updated_at).toLocaleDateString()}</p>
                                <p className="text-xs text-muted-foreground">Last Updated</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
