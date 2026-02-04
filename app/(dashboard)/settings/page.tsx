
"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getProfileSettingsAction, updateProfileSettingsAction, uploadAvatarAction } from "@/app/actions/settings"
import { useSession } from "next-auth/react"

export default function SettingsPage() {
    const router = useRouter()
    const { data: session } = useSession()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [profile, setProfile] = useState<any>(null)
    const [fullName, setFullName] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        async function fetchProfile() {
            setLoading(true)
            const result = await getProfileSettingsAction()
            if ('error' in result && result.error) {
                // If unauthorized or not found
                console.error(result.error)
            } else {
                const data = result as any
                setProfile(data)
                setFullName(data.full_name || "")
            }
            setLoading(false)
        }
        fetchProfile()
    }, [session]) // Re-run when session loads

    async function handleSave() {
        if (!profile) return

        setSaving(true)
        const result = await updateProfileSettingsAction({ full_name: fullName })

        if (result.error) {
            toast.error("Failed to update profile")
        } else {
            toast.success("Profile updated")
            router.refresh()
        }
        setSaving(false)
    }

    async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
        try {
            if (!event.target.files || event.target.files.length === 0) {
                return
            }
            if (!profile) return

            setUploading(true)
            const file = event.target.files[0]

            const formData = new FormData()
            formData.append("file", file)

            const result = await uploadAvatarAction(formData)

            if (result.error) {
                throw new Error(result.error)
            }

            // Update local state
            setProfile({ ...profile, avatar_url: result.url })
            toast.success("Avatar updated successfully")
            router.refresh()
        } catch (error: any) {
            console.error(error)
            toast.error("Error uploading avatar: " + (error.message || "Unknown error"))
        } finally {
            setUploading(false)
        }
    }

    if (loading) return <div>Loading...</div>

    return (
        <div className="space-y-8 max-w-3xl mx-auto p-4 sm:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground mt-1">Manage your account settings and profile.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative group">
                                <Avatar className="h-24 w-24 cursor-pointer ring-2 ring-offset-2 ring-transparent group-hover:ring-primary transition-all" onClick={() => fileInputRef.current?.click()}>
                                    <AvatarImage src={profile?.avatar_url || ""} />
                                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                                        {fullName?.substring(0, 2).toUpperCase() || "ME"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-medium" onClick={() => fileInputRef.current?.click()}>
                                    Change
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                disabled={uploading}
                            />
                            {uploading && <p className="text-xs text-muted-foreground animate-pulse">Uploading...</p>}
                        </div>

                        <div className="flex-1 space-y-4 w-full">
                            <div className="grid gap-2">
                                <Label htmlFor="fullName">Display Name</Label>
                                <Input
                                    id="fullName"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Your name"
                                    className="max-w-md"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    disabled
                                    value={profile?.email || ""}
                                    placeholder="email@example.com"
                                    className="max-w-md bg-muted"
                                />
                                <p className="text-[10px] text-muted-foreground">Email cannot be changed.</p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="role">Role</Label>
                                <Input
                                    id="role"
                                    disabled
                                    value={profile?.role || ""}
                                    className="max-w-md capitalize bg-muted"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving Changes..." : "Save Changes"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
