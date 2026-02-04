
import { LeadsTable } from "@/components/leads/leads-table"
import { LeadDialog } from "@/components/leads/lead-dialog"
import { LeadImportDialog } from "@/components/leads/lead-import-dialog"
import { DeleteAllLeadsButton } from "@/components/leads/delete-all-leads-button"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export default async function LeadsPage() {
    // Get current user role and team context
    const session = await auth()

    // Default empty array if no session
    let leadsData: any[] = []
    let userRole = 'sales'

    if (session?.user?.email) {
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                managedTeam: {
                    include: { members: { select: { id: true } } }
                }
            }
        })

        if (currentUser) {
            userRole = currentUser.role as string

            let whereClause: any = {}

            if (currentUser.role === 'admin') {
                // Admin sees all
                whereClause = {}
            } else if (currentUser.role === 'manager') {
                // Manager sees leads assigned to them OR their team members
                const teamMemberIds = (currentUser as any).managedTeam?.members.map((m: any) => m.id) || []
                teamMemberIds.push(currentUser.id) // Include manager's own leads

                whereClause = {
                    assignedToId: { in: teamMemberIds }
                }
            } else {
                // Sales sees only their own leads
                whereClause = {
                    assignedToId: currentUser.id
                }
            }

            leadsData = await prisma.lead.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                include: {
                    assignee: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatarUrl: true,
                            role: true,
                            status: true,
                            createdAt: true
                        }
                    }
                }
            })
        }
    }

    const profilesData = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
            status: true,
            createdAt: true
        }
    })

    // Transform data to match component expectations (snake_case)
    const profiles = profilesData.map(p => ({
        id: p.id,
        email: p.email,
        full_name: p.name,
        avatar_url: p.avatarUrl,
        role: p.role,
        status: p.status,
        created_at: p.createdAt.toISOString()
    }))

    const leads = leadsData.map(lead => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        assigned_to: lead.assignedToId,
        created_at: lead.createdAt.toISOString(),
        updated_at: lead.updatedAt.toISOString(),
        company: lead.company,
        city: lead.city,
        notes: lead.notes,
        assignee: lead.assignee ? {
            id: lead.assignee.id,
            email: lead.assignee.email,
            full_name: lead.assignee.name,
            avatar_url: lead.assignee.avatarUrl,
            role: lead.assignee.role,
            status: lead.assignee.status,
            created_at: lead.assignee.createdAt.toISOString()
        } : null
    }))

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <DeleteAllLeadsButton userRole={userRole} />
                    <LeadImportDialog />
                    <LeadDialog />
                </div>
            </div>
            <LeadsTable initialLeads={leads as any[]} profiles={profiles as any[]} />
        </div>
    )
}
