export type UserRole = 'admin' | 'sales';

export interface User {
    id: string;
    name: string;
    email: string;
    password?: string; // Only for checking, not typically stored in frontend state
    role: UserRole;
    created_at?: string;
}

export type LeadStatus = 'New' | 'Contacted' | 'Follow-up' | 'Negotiation' | 'Converted' | 'Lost';

export type ProductInterest = 'Bra' | 'Panty' | 'Lingerie' | 'Bedsheet';

export interface Lead {
    id: string;
    created_at: string;
    company_name: string;
    contact_person: string;
    phone: string;
    whatsapp?: string;
    email?: string;
    product_interest: ProductInterest;
    quantity?: number;
    expected_price?: number;
    lead_source?: string; // e.g. Indiamart, Facebook
    city?: string;
    state?: string;
    country?: string;
    status: LeadStatus;
    notes?: string;
    assigned_to?: string; // User ID
    assigned_to_name?: string; // For display purposes
}

export interface FollowUp {
    id: string;
    lead_id: string;
    follow_up_date: string;
    notes: string;
    status: 'Pending' | 'Completed';
    created_at: string;
}

export interface Customer {
    id: string; // usually linked to lead_id or separate
    company_name: string;
    total_orders: number;
    total_order_value: number;
    notes?: string;
    created_at: string;
}
