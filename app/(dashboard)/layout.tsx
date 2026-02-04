import { redirect } from "next/navigation"
import { MobileSidebar, Sidebar } from "@/components/sidebar"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { Profile } from "@/types"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await auth()

    if (!session?.user?.email) {
        redirect("/login")
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    })

    if (!user) {
        redirect("/login")
    }

    // Map Prisma User to Profile interface
    const profile: Profile = {
        id: user.id,
        email: user.email,
        full_name: user.name,
        avatar_url: user.avatarUrl,
        role: user.role as any,
        status: user.status as any,
        created_at: user.createdAt.toISOString()
    }

    return (
        <div className="flex min-h-screen bg-gray-50/50">
            <Sidebar profile={profile} />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header */}
                <div className="lg:hidden h-16 border-b bg-white flex items-center px-4 justify-between shrink-0">
                    <div className="flex items-center font-bold text-lg">
                        <img src="/logo.png" alt="Mikromedia" className="mr-2 h-8 w-auto" />
                    </div>
                    <MobileSidebar profile={profile} />
                </div>

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
