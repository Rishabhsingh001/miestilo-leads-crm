import { createClient } from "@/lib/supabase/server"
import { ActivityLogsView } from "@/components/activity/activity-logs-view"

export default async function ActivityLogsPage() {
    const supabase = await createClient()
    const { data: logs } = await supabase
        .from('activity_logs')
        .select('*, user:profiles(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(200)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-outfit">Activity Logs</h1>
            </div>

            <ActivityLogsView initialLogs={logs || []} />
        </div>
    )
}
