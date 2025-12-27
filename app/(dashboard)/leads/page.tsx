"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLeads, deleteLead, getUsers, bulkAssignLeads } from '@/services/api';
import { Lead, LeadStatus, ProductInterest, User } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Search, Trash2, Edit, Eye, Filter, Phone, CheckSquare, Square, UserPlus } from 'lucide-react';
import FollowUpModal from '@/components/leads/FollowUpModal';

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<LeadStatus | 'All'>('All');
    const [productFilter, setProductFilter] = useState<ProductInterest | 'All'>('All');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
    const [users, setUsers] = useState<User[]>([]);
    const [assignUser, setAssignUser] = useState('');

    useEffect(() => {
        loadLeads();
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (e) {
            console.error("Failed to load users for assignment", e);
        }
    };

    const loadLeads = async () => {
        setLoading(true);
        try {
            const data = await getLeads();
            setLeads(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        // if (!confirm('Are you sure you want to delete this lead?')) return;
        try {
            await deleteLead(id);
            setLeads(leads.filter(l => l.id !== id));
        } catch (err) {
            alert('Failed to delete lead');
        }
    };

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = lead.company_name.toLowerCase().includes(search.toLowerCase()) ||
            lead.contact_person.toLowerCase().includes(search.toLowerCase()) ||
            lead.phone.includes(search);
        const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
        const matchesProduct = productFilter === 'All' || lead.product_interest === productFilter;

        return matchesSearch && matchesStatus && matchesProduct;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Leads</h1>
                    <p className="text-muted-foreground">Manage your potential sales.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/leads/import">
                        <Button variant="outline">
                            <Plus className="w-4 h-4 mr-2 rotate-45" />
                            Import
                        </Button>
                    </Link>
                    <Link href="/leads/new">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Lead
                        </Button>
                    </Link>
                </div>
            </div>

            {selectedLeadIds.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 text-blue-800 text-sm font-medium">
                        <CheckSquare className="w-4 h-4" />
                        {selectedLeadIds.size} leads selected
                    </div>
                    <div className="flex gap-2 items-center">
                        <select
                            className="h-9 rounded-md border border-blue-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={assignUser}
                            onChange={(e) => setAssignUser(e.target.value)}
                        >
                            <option value="">Select User to Assign...</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                            ))}
                        </select>
                        <Button
                            size="sm"
                            disabled={!assignUser}
                            onClick={async () => {
                                if (!assignUser) return;
                                if (!confirm(`Assign ${selectedLeadIds.size} leads to selected user?`)) return;
                                setLoading(true);
                                try {
                                    await bulkAssignLeads(Array.from(selectedLeadIds), assignUser);
                                    await loadLeads();
                                    setSelectedLeadIds(new Set());
                                    setAssignUser('');
                                    alert('Leads assigned successfully!');
                                } catch (e) {
                                    alert('Failed to assign leads');
                                } finally {
                                    setLoading(false);
                                }
                            }}
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Assign
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                            onClick={() => setSelectedLeadIds(new Set())}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by name, company, phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                        <option value="All">All Status</option>
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="Negotiation">Negotiation</option>
                        <option value="Converted">Converted</option>
                        <option value="Lost">Lost</option>
                    </select>
                    <select
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={productFilter}
                        onChange={(e) => setProductFilter(e.target.value as any)}
                    >
                        <option value="All">All Products</option>
                        <option value="Bra">Bra</option>
                        <option value="Panty">Panty</option>
                        <option value="Lingerie">Lingerie</option>
                        <option value="Bedsheet">Bedsheet</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 w-10">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={filteredLeads.length > 0 && selectedLeadIds.size === filteredLeads.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedLeadIds(new Set(filteredLeads.map(l => l.id)));
                                            } else {
                                                setSelectedLeadIds(new Set());
                                            }
                                        }}
                                    />
                                </th>
                                <th className="px-6 py-4">Company / Contact</th>
                                <th className="px-6 py-4">Product</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Source</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading leads...</td></tr>
                            ) : filteredLeads.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No leads found.</td></tr>
                            ) : (
                                filteredLeads.map((lead) => (
                                    <tr key={lead.id} className={`hover:bg-gray-50 bg-white ${selectedLeadIds.has(lead.id) ? 'bg-blue-50/50' : ''}`}>
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-primary focus:ring-primary"
                                                checked={selectedLeadIds.has(lead.id)}
                                                onChange={(e) => {
                                                    const newSet = new Set(selectedLeadIds);
                                                    if (e.target.checked) {
                                                        newSet.add(lead.id);
                                                    } else {
                                                        newSet.delete(lead.id);
                                                    }
                                                    setSelectedLeadIds(newSet);
                                                }}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{lead.company_name}</div>
                                            <div className="text-xs text-gray-500">{lead.contact_person} • {lead.phone}</div>
                                            {lead.assigned_to_name && (
                                                <div className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                                                    Assigned: {lead.assigned_to_name}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-700">
                                                {lead.product_interest}
                                            </span>
                                            {lead.quantity && <div className="text-xs text-gray-500 mt-1">Qty: {lead.quantity}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                        ${lead.status === 'New' ? 'bg-blue-100 text-blue-800' :
                                                    lead.status === 'Converted' ? 'bg-green-100 text-green-800' :
                                                        lead.status === 'Lost' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'}`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {lead.lead_source || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <Link href={`/leads/${lead.id}`}>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <Edit className="h-4 w-4 text-gray-500" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 hover:text-blue-600"
                                                onClick={() => setSelectedLead(lead)}
                                                title="Schedule Follow-up"
                                            >
                                                <Phone className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 hover:text-red-600"
                                                onClick={() => handleDelete(lead.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedLead && (
                <FollowUpModal
                    isOpen={!!selectedLead}
                    onClose={() => setSelectedLead(null)}
                    lead={selectedLead}
                />
            )}
        </div>
    );
}
