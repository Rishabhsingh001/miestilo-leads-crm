"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import LeadForm from '@/components/leads/LeadForm';
import { getLead, updateLead } from '@/services/api';
import { Lead } from '@/types';
import { Loader2 } from 'lucide-react';

export default function EditLeadPage() {
    const params = useParams();
    const id = params.id as string;
    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            try {
                const data = await getLead(id);
                setLead(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const handleSubmit = async (data: Partial<Lead>) => {
        await updateLead(id, data);
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>;
    if (!lead) return <div>Lead not found</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Edit Lead</h1>
                <p className="text-muted-foreground">{lead.company_name}</p>
            </div>
            <LeadForm initialData={lead} onSubmit={handleSubmit} isEditing />
        </div>
    );
}
