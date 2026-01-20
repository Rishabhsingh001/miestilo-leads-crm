import { createClient } from "./supabase/client"

export type LogAction =
    | 'Lead Created'
    | 'Lead Updated'
    | 'Status Changed'
    | 'Lead Assigned'
    | 'Task Created'
    | 'Task Completed'
    | 'Login'
    | 'Logout'
    | 'Note Added'
    | 'Lead Deleted'

export type EntityType = 'lead' | 'task' | 'auth' | 'user'

export async function logActivity(action: LogAction, entityType: EntityType, entityId?: string, details?: any) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase.from('activity_logs').insert({
        user_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details
    })

    if (error) {
        console.error('Failed to log activity:', error)
    }
}
