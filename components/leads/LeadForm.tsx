"use client";

import { useEffect, useState } from 'react';
import { Lead, ProductInterest, LeadStatus, User } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';
import { getUsers } from '@/services/api';

interface LeadFormProps {
    initialData?: Lead;
    onSubmit: (data: Partial<Lead>) => Promise<void>;
    isEditing?: boolean;
}

export default function LeadForm({ initialData, onSubmit, isEditing = false }: LeadFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<User[]>([]);

    // Form State
    const [formData, setFormData] = useState<Partial<Lead>>({
        company_name: '',
        contact_person: '',
        phone: '',
        whatsapp: '',
        email: '',
        product_interest: 'Bra',
        quantity: 0,
        expected_price: 0,
        lead_source: '',
        city: '',
        state: '',
        country: 'India',
        status: 'New',
        notes: '',
        assigned_to: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
        // Load users for assignment
        const loadUsers = async () => {
            try {
                const data = await getUsers();
                setUsers(data);
            } catch (e) {
                console.error("Failed to load users", e);
            }
        }
        loadUsers();
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
            router.push('/leads');
        } catch (error) {
            console.error(error);
            alert('Failed to save lead');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="space-y-2">
                    <label className="text-sm font-medium">Company Name *</label>
                    <Input name="company_name" value={formData.company_name} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Contact Person *</label>
                    <Input name="contact_person" value={formData.contact_person} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Phone *</label>
                    <Input name="phone" value={formData.phone} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">WhatsApp</label>
                    <Input name="whatsapp" value={formData.whatsapp} onChange={handleChange} />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input name="email" type="email" value={formData.email} onChange={handleChange} />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Product Interest</label>
                    <select
                        name="product_interest"
                        value={formData.product_interest}
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="Bra">Bra</option>
                        <option value="Panty">Panty</option>
                        <option value="Lingerie">Lingerie</option>
                        <option value="Bedsheet">Bedsheet</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Quantity</label>
                    <Input name="quantity" type="number" value={formData.quantity} onChange={handleChange} />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Expected Price</label>
                    <Input name="expected_price" type="number" value={formData.expected_price} onChange={handleChange} />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Lead Source</label>
                    <Input name="lead_source" placeholder="e.g. Indiamart, Facebook" value={formData.lead_source} onChange={handleChange} />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">City</label>
                    <Input name="city" value={formData.city} onChange={handleChange} />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">State</label>
                    <Input name="state" value={formData.state} onChange={handleChange} />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Assigned To</label>
                    <select
                        name="assigned_to"
                        value={formData.assigned_to}
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="">-- Select User --</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Status</label>
                    <div className="flex gap-2 flex-wrap">
                        {['New', 'Contacted', 'Follow-up', 'Negotiation', 'Converted', 'Lost'].map(status => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, status: status as LeadStatus }))}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${formData.status === status
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Notes</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={4}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                </div>

            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" isLoading={loading}>{isEditing ? 'Update Lead' : 'Save Lead'}</Button>
            </div>
        </form>
    );
}
