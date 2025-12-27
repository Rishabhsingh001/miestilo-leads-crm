import { User, Lead, FollowUp, Customer } from '@/types';

// Mock Data / LocalStorage Implementation
// This replaces the Supabase service to run entirely on the frontend.

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getStorage = (key: string) => {
    if (typeof window === 'undefined') return [];
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : [];
    } catch {
        return [];
    }
};

const setStorage = (key: string, data: any[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
};

// Seed initial admin if not exists
const seedUsers = () => {
    const users = getStorage('users');
    if (users.length === 0) {
        const admin: User = {
            id: '1',
            name: 'Admin User',
            email: 'admin@miestilo.com',
            password: 'admin',
            role: 'admin',
            created_at: new Date().toISOString()
        };
        setStorage('users', [admin]);
    }
};

// Ensure seeding happens on client side load (naive approach)
if (typeof window !== 'undefined') {
    seedUsers();
}

// --- USERS ---

export const getUsers = async () => {
    await delay(500); // Simulate network
    return getStorage('users') as User[];
};

export const createUser = async (user: Omit<User, 'id' | 'created_at'>) => {
    await delay(500);
    const users = getStorage('users');
    const newUser = {
        ...user,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
    };
    users.push(newUser);
    setStorage('users', users);
    return newUser as User;
};

export const updateUser = async (id: string, updates: Partial<User>) => {
    await delay(500);
    const users = getStorage('users');
    const index = users.findIndex((u: User) => u.id === id);
    if (index === -1) throw new Error('User not found');

    users[index] = { ...users[index], ...updates };
    setStorage('users', users);
    return users[index] as User;
};

export const deleteUser = async (id: string) => {
    await delay(500);
    const users = getStorage('users');
    const filtered = users.filter((u: User) => u.id !== id);
    setStorage('users', filtered);
};

// --- LEADS ---

export const getLeads = async () => {
    await delay(500);
    const leads = getStorage('leads');
    // Join logic simulation (assigned_to name)
    const users = getStorage('users');
    return leads.map((lead: Lead) => {
        const user = users.find((u: User) => u.id === lead.assigned_to);
        return { ...lead, assigned_to_name: user ? user.name : undefined };
    }).sort((a: Lead, b: Lead) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as Lead[]; // Desc sort
};

export const getLead = async (id: string) => {
    await delay(200);
    const leads = getStorage('leads');
    const lead = leads.find((l: Lead) => l.id === id);
    if (!lead) throw new Error('Lead not found');
    return lead as Lead;
};

export const createLead = async (lead: Partial<Lead>) => {
    await delay(500);
    const leads = getStorage('leads');
    const newLead = {
        ...lead,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        status: lead.status || 'New'
    };
    leads.push(newLead);
    setStorage('leads', leads);
    return newLead as Lead;
};

export const createLeads = async (leads: Partial<Lead>[]) => {
    await delay(1000); // Simulate processing time
    const currentLeads = getStorage('leads');
    const newLeads = leads.map(lead => ({
        ...lead,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        status: lead.status || 'New',
        product_interest: lead.product_interest || 'Bra' // Default if missing
    }));

    // Append new leads
    const updatedLeads = [...currentLeads, ...newLeads];
    setStorage('leads', updatedLeads);
    return newLeads.length;
};

export const bulkAssignLeads = async (leadIds: string[], userId: string) => {
    await delay(500);
    const leads = getStorage('leads');
    let count = 0;
    const updatedLeads = leads.map((lead: Lead) => {
        // Ensure ID comparison is robust
        if (leadIds.includes(lead.id.toString())) {
            count++;
            return { ...lead, assigned_to: userId };
        }
        return lead;
    });
    setStorage('leads', updatedLeads);
    console.log(`Assigned ${count} leads to user ${userId}`);
    return count;
};

export const updateLead = async (id: string, updates: Partial<Lead>) => {
    await delay(500);
    const leads = getStorage('leads');
    const index = leads.findIndex((l: Lead) => l.id === id);
    if (index === -1) throw new Error('Lead not found');

    const oldStatus = leads[index].status;
    const updatedLead = { ...leads[index], ...updates };
    leads[index] = updatedLead;
    setStorage('leads', leads);

    // If status changed to Converted, add to customers automatically
    if (updates.status === 'Converted' && oldStatus !== 'Converted') {
        const customers = getStorage('customers');
        const exists = customers.find((c: Customer) => c.id === id); // Use same ID or link
        if (!exists) {
            const newCustomer: Customer = {
                id: id, // Link ID
                company_name: updatedLead.company_name,
                total_orders: 1,
                total_order_value: updatedLead.expected_price || 0,
                notes: updatedLead.notes,
                created_at: new Date().toISOString()
            };
            customers.push(newCustomer);
            setStorage('customers', customers);
        }
    }

    return updatedLead as Lead;
};

export const deleteLead = async (id: string) => {
    await delay(500);
    const leads = getStorage('leads');
    const filtered = leads.filter((l: Lead) => l.id !== id);
    setStorage('leads', filtered);
};

// --- FOLLOW UPS ---

export const getFollowUps = async () => {
    await delay(500);
    const followUps = getStorage('follow_ups');
    const leads = getStorage('leads');

    // Join
    return followUps.map((f: FollowUp) => {
        const lead = leads.find((l: Lead) => l.id === f.lead_id);
        return { ...f, leads: lead };
    }).sort((a: any, b: any) => new Date(a.follow_up_date).getTime() - new Date(b.follow_up_date).getTime());
};

export const createFollowUp = async (followUp: Partial<FollowUp>) => {
    await delay(500);
    const followUps = getStorage('follow_ups');
    const newFollowUp = {
        ...followUp,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        status: 'Pending'
    };
    followUps.push(newFollowUp);
    setStorage('follow_ups', followUps);
    return newFollowUp as FollowUp;
};

export const deleteFollowUp = async (id: string) => {
    await delay(500);
    const followUps = getStorage('follow_ups');
    const filtered = followUps.filter((f: FollowUp) => f.id !== id);
    setStorage('follow_ups', filtered);
};

// --- CUSTOMERS ---

export const getCustomers = async () => {
    await delay(500);
    return getStorage('customers') as Customer[];
};

export const deleteCustomer = async (id: string) => {
    await delay(500);
    const customers = getStorage('customers');
    const filtered = customers.filter((c: Customer) => c.id !== id);
    setStorage('customers', filtered);
};

// --- DASHBOARD ---

export const getDashboardStats = async () => {
    await delay(500);
    const leads = getStorage('leads');
    const customers = getStorage('customers');
    const followUps = getStorage('follow_ups');

    const today = new Date().toISOString().split('T')[0];
    const followUpsToday = followUps.filter((f: FollowUp) => f.follow_up_date === today).length;

    return {
        totalLeads: leads.length,
        newLeads: leads.filter((l: Lead) => l.status === 'New').length,
        convertedCustomers: customers.length,
        followUpsToday
    };
};

export const loginUserMock = async (email: string, pass: string) => {
    await delay(800);
    // Ensure seeds exist
    seedUsers();
    const users = getStorage('users');
    const user = users.find((u: User) => u.email === email && u.password === pass);
    if (!user) return { error: 'Invalid credentials' };
    return { data: user, error: null };
};
