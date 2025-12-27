"use client";

import { useEffect, useState } from 'react';
import { getUsers, createUser, deleteUser } from '@/services/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { User } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Trash2, ShieldAlert, BadgeCheck } from 'lucide-react';

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // New User Form State
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'sales' });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await createUser(newUser as any);
            setNewUser({ name: '', email: '', password: '', role: 'sales' });
            loadUsers();
        } catch (e) {
            alert('Error creating user');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        // if (!confirm('Delete this user?')) return; // Removed for smoother interaction
        try {
            await deleteUser(id);
            setUsers(prev => prev.filter(u => u.id !== id));
        } catch (e) {
            alert('Error deleting user');
        }
    };

    if (currentUser?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center">
                <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
                <p className="text-gray-500 mt-2">Only administrators can manage users.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">User Management</h1>
                <p className="text-muted-foreground">Manage system access for your team.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Create User Form */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">Add New User</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} required placeholder="Full Name" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required placeholder="email@company.com" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Password</label>
                                <Input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required placeholder="******" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                >
                                    <option value="sales">Sales</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <Button type="submit" className="w-full" isLoading={creating}>Create User</Button>
                        </form>
                    </CardContent>
                </Card>

                {/* User List */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">All Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {loading ? <p>Loading...</p> : users.map(u => (
                                <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                                            {u.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{u.name}</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm text-gray-500">{u.email}</p>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {u.role}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {u.id !== currentUser?.id && (
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(u.id)} className="text-red-500 hover:bg-red-50">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                    {u.id === currentUser?.id && (
                                        <BadgeCheck className="w-5 h-5 text-green-500" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
