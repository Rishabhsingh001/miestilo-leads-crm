"use client";

import { useEffect, useState } from 'react';
import { getCustomers, deleteCustomer } from '@/services/api';
import { Customer } from '@/types';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await getCustomers();
                setCustomers(data);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        }
        load();
    }, []);

    const handleDelete = async (id: string) => {
        try {
            await deleteCustomer(id);
            setCustomers(prev => prev.filter(c => c.id !== id));
        } catch (e) {
            alert('Failed to delete customer');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Customers</h1>
                <p className="text-muted-foreground">List of converted clients.</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 font-medium text-gray-500">Company</th>
                            <th className="px-6 py-4 font-medium text-gray-500">Total Orders</th>
                            <th className="px-6 py-4 font-medium text-gray-500">Total Value</th>
                            <th className="px-6 py-4 font-medium text-gray-500">Join Date</th>
                            <th className="px-6 py-4 font-medium text-gray-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? <tr><td colSpan={5} className="p-6 text-center">Loading...</td></tr> :
                            customers.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-gray-500">No customers yet. convert some leads!</td></tr> :
                                customers.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                            <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                                                <ShoppingBag className="w-4 h-4" />
                                            </div>
                                            {c.company_name}
                                        </td>
                                        <td className="px-6 py-4">{c.total_orders}</td>
                                        <td className="px-6 py-4 text-green-600 font-medium">₹{c.total_order_value?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 hover:text-red-600"
                                                onClick={() => handleDelete(c.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                        }
                    </tbody>
                </table>
            </div>
        </div>
    );
}
