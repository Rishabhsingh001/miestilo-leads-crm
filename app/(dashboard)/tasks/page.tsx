import { createClient } from "@/lib/supabase/server"
import { TasksView } from "@/components/tasks/tasks-view"

export default async function TasksPage() {
    const supabase = await createClient()

    // Fetch tasks including linked lead and assigned profile
    // We use the column name hint !assigned_to because there are two FKs to profiles (assigned_to and created_by)
    const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
            *,
            assignee:profiles!assigned_to(full_name, email),
            lead:leads(name)
        `)
        .order('due_date', { ascending: true })

    if (error) {
        console.error("Error fetching tasks:", error)
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            </div>
            <TasksView initialTasks={tasks || []} />
        </div>
    )
}
