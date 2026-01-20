"use client"

import { useState } from "react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Activity, Lock, Eye, EyeOff } from "lucide-react"

export function UserEditDialog({ user }: { user: any }) {
    const [open, setOpen] = useState(false)
    const [role, setRole] = useState(user.role)
    const [status, setStatus] = useState(user.status)
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [saving, setSaving] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    async function handleSave() {
        setSaving(true)

        // Update Profile basics
        const { error } = await supabase
            .from('profiles')
            .update({ role, status })
            .eq('id', user.id)

        if (error) {
            toast.error("Failed to update profile: " + error.message)
            setSaving(false)
            return
        }

        // Handle Password Update if provided
        if (password) {
            if (password.length < 6) {
                toast.error("Password must be at least 6 characters")
                setSaving(false)
                return
            }

            // Note: Admin resetting another user's password requires Service Role Key on backend
            toast.info("Password reset for other users requires Admin API permissions.")
        }

        toast.success("User updated successfully")
        setOpen(false)
        router.refresh()
        setSaving(false)
    }

    async function handleRemove() {
        if (!confirm(`Are you sure you want to remove ${user.full_name || user.email}? This will delete their profile.`)) return

        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', user.id)

        if (error) {
            toast.error("Failed to delete profile: " + error.message)
        } else {
            toast.success("User profile removed.")
            setOpen(false)
            router.refresh()
        }
    }

    function viewActivity() {
        router.push(`/activity-logs?search=${user.email}`)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit User & Credentials</DialogTitle>
                    <DialogDescription>
                        Modify role, status, or login details for {user.full_name || user.email}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">
                            Role
                        </Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="sales">Sales</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">
                            Status
                        </Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="disabled">Disabled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="pass-update" className="text-right">
                            New Pass
                        </Label>
                        <div className="col-span-3 relative">
                            <Input
                                id="pass-update"
                                type={showPassword ? "text" : "password"}
                                placeholder="Update password (leave empty to keep)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t mt-2">
                    <Button variant="outline" className="justify-start" onClick={viewActivity}>
                        <Activity className="mr-2 h-4 w-4" /> View User Activity
                    </Button>
                    <Button variant="outline" className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleRemove}>
                        <Trash2 className="mr-2 h-4 w-4" /> Remove User
                    </Button>
                </div>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
