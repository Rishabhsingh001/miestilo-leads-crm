
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UserEditDialog } from "@/components/users/user-edit-dialog"
import { UserInviteDialog } from "@/components/users/user-invite-dialog"
import { Shield, Users as UsersIcon, Mail, Calendar } from "lucide-react"
import { format } from "date-fns"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"

export default async function UsersPage() {
    const session = await auth()
    if (!session?.user?.email) redirect("/login")

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true }
    })

    if (currentUser?.role !== 'admin') {
        redirect("/dashboard")
    }

    const prismaUsers = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
    })

    const users = prismaUsers.map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.name,
        avatar_url: user.avatarUrl,
        role: user.role as any,
        status: user.status as any,
        created_at: user.createdAt.toISOString()
    }))

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">User Management</h1>
                    <p className="text-muted-foreground">Manage team members, roles, and access permissions.</p>
                </div>
                <UserInviteDialog />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <UsersIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Admins</CardTitle>
                        <Shield className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b">
                    <CardTitle>Team Members</CardTitle>
                </CardHeader>
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead>User Information</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="hidden md:table-cell">Joined Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                            {(user.full_name || user.email)[0].toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-900">{user.full_name || 'N/A'}</span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Mail className="h-3 w-3" /> {user.email}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className={`capitalize font-medium ${user.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' :
                                        user.role === 'manager' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                            'bg-slate-100 text-slate-700 border-slate-200'
                                        }`}>
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.status === 'active' ? 'default' : 'destructive'} className="capitalize">
                                        {user.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <UserEditDialog user={user} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
