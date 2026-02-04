
import { ActivityLogsView } from "@/components/activity/activity-logs-view"
import prisma from "@/lib/prisma"

export default async function ActivityLogsPage() {
    const logsData = await prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
            user: {
                select: {
                    name: true,
                    email: true
                }
            }
        }
    })

    const logs = logsData.map(log => ({
        id: log.id,
        user_id: log.userId,
        action: log.action,
        entity_type: log.entityType,
        entity_id: log.entityId,
        details: log.details, // This is a JSON string in Prisma model but maybe component expects object? Supabase returns JSON column as object.
        // Prisma: details String // Stored as JSON string
        // I might need to JSON.parse(log.details) if it's stored as string.
        created_at: log.createdAt.toISOString(),
        user: log.user ? { full_name: log.user.name, email: log.user.email } : null
    }))

    // In Prisma schema: details String // Stored as JSON string
    // So I should parse it.
    const parsedLogs = logs.map(l => {
        try {
            return {
                ...l,
                details: typeof l.details === 'string' ? JSON.parse(l.details) : l.details
            }
        } catch (e) {
            return l
        }
    })


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-outfit">Activity Logs</h1>
            </div>

            <ActivityLogsView initialLogs={parsedLogs} />
        </div>
    )
}
