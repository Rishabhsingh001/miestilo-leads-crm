"use client";

import { useState } from 'react';
// Dialog custom implementation used below
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createFollowUp, updateLead } from '@/services/api';
import { Lead } from '@/types';
import { X } from 'lucide-react';

interface FollowUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead;
}

export default function FollowUpModal({ isOpen, onClose, lead }: FollowUpModalProps) {
    const [date, setDate] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createFollowUp({
                lead_id: lead.id,
                follow_up_date: date, // YYYY-MM-DD
                notes: notes,
                status: 'Pending'
            });

            // Optionally update lead status to 'Follow-up'
            if (lead.status !== 'Follow-up') {
                await updateLead(lead.id, { status: 'Follow-up' });
            }

            alert('Follow-up scheduled!');
            onClose();
        } catch (err) {
            alert('Failed to schedule follow-up');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Schedule Follow-up</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700 mb-2">
                        Scheduling for <span className="font-semibold">{lead.company_name}</span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Date</label>
                        <Input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Notes</label>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            placeholder="Call regarding..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            required
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" isLoading={loading}>Schedule</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
