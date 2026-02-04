
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
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { UserPlus, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { createTeamMemberAction } from "@/app/actions/users"

export function UserInviteDialog() {
    const [open, setOpen] = useState(false)
    const [email, setEmail] = useState("")
    const [fullName, setFullName] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [role, setRole] = useState("sales")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleCreate() {
        if (!email || !password || !fullName) {
            toast.error("Please fill in all fields (Email, Name, Password)")
            return
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }

        setLoading(true)

        const result = await createTeamMemberAction({
            email,
            password,
            fullName,
            role
        })

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(`User ${fullName} (${email}) created successfully.`)
            setOpen(false)
            resetForm()
            router.refresh()
        }
        setLoading(false)
    }

    const resetForm = () => {
        setEmail("")
        setFullName("")
        setPassword("")
        setRole("sales")
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" /> Add New User
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Team Member</DialogTitle>
                    <DialogDescription>
                        Directly add a user with email and password credentials.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="create-name">Full Name</Label>
                        <Input
                            id="create-name"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="create-email">Login Email (ID)</Label>
                        <div className="relative">
                            <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="create-email"
                                type="email"
                                placeholder="name@example.com"
                                className="pl-9"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="create-password">Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="create-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="pl-9"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Min. 6 characters</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="create-role">Access Role</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger id="create-role">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="sales">Sales / Sales Rep</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={loading}>
                        {loading ? "Creating..." : "Create User"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
