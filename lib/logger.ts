
import { logActivityAction } from "@/app/actions";

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
    try {
        await logActivityAction(action, entityType, entityId, details);
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
}
