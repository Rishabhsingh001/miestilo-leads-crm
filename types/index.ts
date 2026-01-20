export type Role = 'admin' | 'manager' | 'sales'

export interface Profile {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    role: Role
    status: 'active' | 'disabled'
    created_at: string
}

export interface Lead {
    id: string
    name: string
    email: string | null
    phone: string | null
    country: string | null
    source: string | null
    status: string
    assigned_to: string | null
    created_by: string | null
    notes: string | null
    last_followup: string | null
    next_followup: string | null
    company: string | null
    city: string | null
    profession: string | null
    course_name: string | null
    time_in_session: string | null
    days_attended: number | null
    bootcamp_attendee: boolean | null
    utm_source: string | null
    utm_campaign: string | null
    utm_medium: string | null
    utm_content: string | null
    utm_term: string | null
    created_at: string
    updated_at: string

    // Joins
    assignee?: Profile
}

export interface Task {
    id: string
    title: string
    description: string | null
    priority: 'low' | 'medium' | 'high'
    status: 'pending' | 'in-progress' | 'done'
    due_date: string | null
    assigned_to: string | null
    lead_id: string | null
    created_by: string | null
    created_at: string

    // Joins
    assignee?: Profile
    lead?: Lead
}

export interface ActivityLog {
    id: string
    user_id: string | null
    action: string
    entity_type: string
    entity_id: string | null
    details: any
    created_at: string

    // Joins
    user?: Profile
}

export interface LeadNote {
    id: string
    lead_id: string
    user_id: string
    content: string
    created_at: string

    // Joins
    user?: Profile
}
