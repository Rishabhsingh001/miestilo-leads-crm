"use client";

import { useEffect, useState } from 'react';
import { getDashboardStats, getLeads } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, UserPlus, Phone, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { Lead } from '@/types';
import Link from 'next/link';

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalLeads: 0,
        newLeads: 0,
        convertedCustomers: 0,
        followUpsToday: 0
    });
    const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const statsData = await getDashboardStats();
                setStats(statsData);
                const leadsData = await getLeads();
                setRecentLeads(leadsData.slice(0, 5)); // Top 5 recent
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const statCards = [
        { title: 'Total Leads', value: stats.totalLeads, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: 'New Leads', value: stats.newLeads, icon: UserPlus, color: 'text-green-600', bg: 'bg-green-50' },
        { title: 'Follow-ups Today', value: stats.followUpsToday, icon: Phone, color: 'text-orange-600', bg: 'bg-orange-50' },
        { title: 'Customers', value: stats.convertedCustomers, icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Overview of your lead pipeline.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-2 rounded-full ${stat.bg}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? '-' : stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Leads</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <p>Loading...</p> : (
                            <div className="space-y-4">
                                {recentLeads.map(lead => (
                                    <div key={lead.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-medium text-sm text-gray-900">{lead.company_name}</p>
                                            <p className="text-xs text-gray-500">{lead.contact_person} • {lead.product_interest}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                    ${lead.status === 'New' ? 'bg-green-100 text-green-800' :
                                                    lead.status === 'Converted' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {lead.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {recentLeads.length === 0 && <p className="text-sm text-gray-500">No recent leads found.</p>}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Link href="/leads" className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors group">
                            <span className="text-sm font-medium">Add New Lead</span>
                            <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-900" />
                        </Link>
                        <Link href="/follow-ups" className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors group">
                            <span className="text-sm font-medium">View Schedule</span>
                            <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-900" />
                        </Link>
                        <Link href="/customers" className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors group">
                            <span className="text-sm font-medium">Customer Database</span>
                            <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-900" />
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
