import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MobileSidebar, Sidebar } from "@/components/sidebar"


export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // Fetch profile
    // Note: RLS ensures we only fetch what we can see, but generic select might return null if profile not created yet.
    // Profile is created via trigger.
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

    return (
        <div className="flex min-h-screen bg-gray-50/50">
            <Sidebar profile={profile} />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header */}
                <div className="lg:hidden h-16 border-b bg-white flex items-center px-4 justify-between shrink-0">
                    <div className="flex items-center font-bold text-lg">
                        <img src="/logo.png" alt="Miestilo CRM" className="mr-2 h-8 w-auto" />
                        Miestilo CRM
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
