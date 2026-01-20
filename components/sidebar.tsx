
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, CheckSquare, Settings, LogOut, Shield, Activity, UserCog, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Profile } from "@/types"
import { toast } from "sonner"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet"
import { useState } from "react"
import { logActivity } from "@/lib/logger"

interface SidebarProps {
    profile: Profile | null
}

function SidebarContent({ profile, setOpen }: SidebarProps & { setOpen?: (open: boolean) => void }) {
    const pathname = usePathname()

    const links = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Leads", href: "/leads", icon: Users },
        { name: "Tasks", href: "/tasks", icon: CheckSquare },
    ]

    // Role based links
    if (profile?.role === 'admin' || profile?.role === 'manager') {
        links.push({ name: "Activity Logs", href: "/activity-logs", icon: Activity })
    }
    if (profile?.role === 'admin') {
        links.push({ name: "Manage Users", href: "/users", icon: UserCog })
    }

    links.push({ name: "Settings", href: "/settings", icon: Settings })

    async function handleLogout() {
        const { signOut } = await import("next-auth/react")
        // await logActivity('Logout', 'auth')
        await signOut({ callbackUrl: "/login" })
        toast.success("Logged out")
    }

    return (
        <div className="flex flex-col h-full">
            <div className="h-16 flex items-center px-6 border-b">
                {/* <Shield className="h-6 w-6 mr-2 text-primary" /> */}
                <img src="/logo.png" alt="Mikromedia" className="mr-2 h-10 w-auto" />
                <span className="font-bold text-lg">Mikromedia</span>
            </div>
            <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {links.map((link) => (
                    <Link key={link.href} href={link.href} onClick={() => setOpen?.(false)}>
                        <Button
                            variant={pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href)) ? "secondary" : "ghost"}
                            className={cn("w-full justify-start", (pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))) && "bg-slate-100 font-semibold text-primary")}
                        >
                            <link.icon className="mr-2 h-4 w-4" />
                            {link.name}
                        </Button>
                    </Link>
                ))}
            </div>
            <div className="p-4 border-t mt-auto">
                <div className="mb-4 px-2">
                    <p className="font-medium text-sm truncate">{profile?.full_name || profile?.email || 'User'}</p>
                    <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
                </div>
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    )
}

export function Sidebar({ profile }: SidebarProps) {
    return (
        <div className="w-64 border-r bg-white hidden lg:flex flex-col h-screen sticky top-0">
            <SidebarContent profile={profile} />
        </div>
    )
}

export function MobileSidebar({ profile }: SidebarProps) {
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" className="lg:hidden p-2">
                    <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-white w-72">
                <SidebarContent profile={profile} setOpen={setOpen} />
            </SheetContent>
        </Sheet>
    )
}
