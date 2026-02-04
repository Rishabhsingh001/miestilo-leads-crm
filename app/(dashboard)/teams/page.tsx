
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { TeamList } from "@/components/teams/team-list"

export default async function TeamsPage() {
    const session = await auth()
    if (!session?.user?.email) redirect("/login")

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true }
    })

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
        redirect("/dashboard")
    }

    // Role-based data fetching
    let teams: any[] = []

    if (currentUser.role === 'admin') {
        teams = await prisma.team.findMany({
            include: {
                manager: { select: { id: true, name: true, email: true } },
                members: { select: { id: true, name: true, email: true, role: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
    } else {
        // Manager sees their own team
        teams = await prisma.team.findMany({
            where: { managerId: currentUser.id },
            include: {
                manager: { select: { id: true, name: true, email: true } },
                members: { select: { id: true, name: true, email: true, role: true } }
            }
        })
    }

    const allUsers = await prisma.user.findMany({
        select: { id: true, name: true, email: true, teamId: true }
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Team Management</h1>
                    <p className="text-muted-foreground">Organize and monitor your sales teams.</p>
                </div>
            </div>

            <TeamList
                teams={teams}
                allUsers={allUsers as any[]}
                currentRole={currentUser.role}
            />
        </div>
    )
}
