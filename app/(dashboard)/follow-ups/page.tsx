"use client";

import { useEffect, useState } from 'react';
import { getFollowUps, createFollowUp, deleteFollowUp } from '@/services/api';
import { FollowUp } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Calendar, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
// I didn't install date-fns. I'll use native Date.

export default function FollowUpsPage() {
    const [followUps, setFollowUps] = useState<any[]>([]); // Using any for the join data structure
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getFollowUps();
            setFollowUps(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteFollowUp(id);
            setFollowUps(prev => prev.filter(f => f.id !== id));
        } catch (e) {
            alert('Failed to delete follow up');
        }
    };

    const today = new Date().toISOString().split('T')[0];

    const todaysFollowUps = followUps.filter(f => f.follow_up_date?.startsWith(today));
    const upcomingFollowUps = followUps.filter(f => f.follow_up_date > today);
    const overdueFollowUps = followUps.filter(f => f.follow_up_date < today && f.status !== 'Completed');

    const FollowUpCard = ({ item, isOverdue = false }: { item: any, isOverdue?: boolean }) => (
        <div className={`p-4 rounded-lg border bg-white shadow-sm flex justify-between items-start ${isOverdue ? 'border-red-200 bg-red-50/50' : 'border-gray-200'}`}>
            <div>
                <h4 className="font-semibold text-gray-900">{item.leads?.company_name}</h4>
                <p className="text-sm text-gray-600">Contact: {item.leads?.contact_person}</p>
                <p className="text-sm mt-2 text-gray-700 italic">"{item.notes}"</p>
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.follow_up_date).toLocaleDateString()}
                </div>
            </div>
            <div className="flex flex-col items-end gap-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full 
                ${item.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {item.status}
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:text-red-600"
                    onClick={() => handleDelete(item.id)}
                >
                    <Trash2 className="w-3 h-3" />
                </Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Follow Ups</h1>
                <p className="text-muted-foreground">Scheduled calls and meetings.</p>
            </div>

            {loading ? <p>Loading...</p> : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

                    <section className="space-y-4">
                        <h3 className="flex items-center gap-2 font-semibold text-red-600">
                            <Clock className="w-5 h-5" /> Overdue
                        </h3>
                        {overdueFollowUps.length === 0 && <p className="text-sm text-gray-400">No overdue follow-ups.</p>}
                        {overdueFollowUps.map(f => <FollowUpCard key={f.id} item={f} isOverdue />)}
                    </section>

                    <section className="space-y-4">
                        <h3 className="flex items-center gap-2 font-semibold text-blue-600">
                            <CheckCircle2 className="w-5 h-5" /> Today
                        </h3>
                        {todaysFollowUps.length === 0 && <p className="text-sm text-gray-400">Nothing for today.</p>}
                        {todaysFollowUps.map(f => <FollowUpCard key={f.id} item={f} />)}
                    </section>

                    <section className="space-y-4">
                        <h3 className="flex items-center gap-2 font-semibold text-gray-600">
                            <Calendar className="w-5 h-5" /> Upcoming
                        </h3>
                        {upcomingFollowUps.length === 0 && <p className="text-sm text-gray-400">No upcoming follow-ups.</p>}
                        {upcomingFollowUps.map(f => <FollowUpCard key={f.id} item={f} />)}
                    </section>

                </div>
            )}
        </div>
    );
}
