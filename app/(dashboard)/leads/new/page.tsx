"use client";

import LeadForm from '@/components/leads/LeadForm';
import { createLead } from '@/services/api';
import { Lead } from '@/types';

export default function NewLeadPage() {
    const handleSubmit = async (data: Partial<Lead>) => {
        await createLead(data);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Add New Lead</h1>
                <p className="text-muted-foreground">Enter lead details below.</p>
            </div>
            <LeadForm onSubmit={handleSubmit} />
        </div>
    );
}
