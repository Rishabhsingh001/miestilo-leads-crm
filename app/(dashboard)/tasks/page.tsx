
import { TasksView } from "@/components/tasks/tasks-view"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export default async function TasksPage() {
    const session = await auth()

    let tasksData: any[] = []

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
            let whereClause: any = {}

            if (currentUser.role === 'admin') {
                whereClause = {}
            } else if (currentUser.role === 'manager') {
                const teamMemberIds = (currentUser as any).managedTeam?.members.map((m: any) => m.id) || []
                teamMemberIds.push(currentUser.id)
                whereClause = {
                    assignedToId: { in: teamMemberIds }
                }
            } else {
                whereClause = {
                    assignedToId: currentUser.id
                }
            }

            tasksData = await prisma.task.findMany({
                where: whereClause,
                include: {
                    assignee: {
                        select: {
                            name: true,
                            email: true
                        }
                    },
                    lead: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: {
                    dueDate: 'asc'
                }
            })
        }
    }

    const tasks = tasksData.map(t => ({
        ...t,
        assignee: t.assignee ? { full_name: t.assignee.name, email: t.assignee.email } : null,
        lead: t.lead ? { name: t.lead.name } : null,
        due_date: t.dueDate ? t.dueDate.toISOString() : null,
        created_at: t.createdAt.toISOString()
    }))

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            </div>
            <TasksView initialTasks={tasks} />
        </div>
    )
}
