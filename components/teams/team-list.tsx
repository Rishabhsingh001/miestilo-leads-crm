
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, UserPlus, Trash2, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { createTeamAction, deleteTeamAction, addMemberToTeamAction, removeMemberFromTeamAction } from "@/app/actions/teams"
import { useRouter } from "next/navigation"

export function TeamList({ teams, allUsers, currentRole }: { teams: any[], allUsers: any[], currentRole: string }) {
    const router = useRouter()
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
    const [newTeamName, setNewTeamName] = useState("")
    const [selectedManagerId, setSelectedManagerId] = useState("")
    const [selectedMemberId, setSelectedMemberId] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleCreateTeam() {
        if (!newTeamName || !selectedManagerId) {
            toast.error("Please provide name and manager")
            return
        }
        setLoading(true)
        const res = await createTeamAction(newTeamName, selectedManagerId)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Team created")
            setIsCreateOpen(false)
            router.refresh()
        }
        setLoading(false)
    }

    async function handleDeleteTeam(id: string) {
        if (!confirm("Are you sure?")) return
        const res = await deleteTeamAction(id)
        if (res.error) toast.error(res.error)
        else {
            toast.success("Team deleted")
            router.refresh()
        }
    }

    async function handleAddMember() {
        if (!selectedTeamId || !selectedMemberId) return
        setLoading(true)
        const res = await addMemberToTeamAction(selectedTeamId, selectedMemberId)
        if (res.error) toast.error(res.error)
        else {
            toast.success("Member added")
            setIsAddMemberOpen(false)
            router.refresh()
        }
        setLoading(false)
    }

    async function handleRemoveMember(userId: string) {
        if (!confirm("Remove member from team?")) return
        const res = await removeMemberFromTeamAction(userId)
        if (res.error) toast.error(res.error)
        else {
            toast.success("Member removed")
            router.refresh()
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Teams</h2>
                {currentRole === 'admin' && (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button><Users className="mr-2 h-4 w-4" /> Create Team</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Team</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Team Name</label>
                                    <input
                                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="e.g. Alpha Team"
                                        value={newTeamName}
                                        onChange={(e) => setNewTeamName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Assign Manager</label>
                                    <Select onValueChange={setSelectedManagerId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a manager" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allUsers.map((u) => (
                                                <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateTeam} disabled={loading}>Create</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                {teams.map((team) => (
                    <Card key={team.id} className="relative overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <div>
                                <CardTitle className="text-xl font-bold">{team.name}</CardTitle>
                                <div className="flex items-center text-sm text-slate-500 mt-1">
                                    <ShieldCheck className="mr-1 h-3 w-3 text-primary" />
                                    Manager: {team.manager?.name || team.manager?.email}
                                </div>
                            </div>
                            {currentRole === 'admin' && (
                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteTeam(team.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="mt-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Members ({team.members?.length || 0})</h4>
                                    {(currentRole === 'admin' || currentRole === 'manager') && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => { setSelectedTeamId(team.id); setIsAddMemberOpen(true); }}
                                        >
                                            <UserPlus className="mr-2 h-4 w-4" /> Add
                                        </Button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {team.members?.map((member: any) => (
                                        <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
                                                    {(member.name || member.email)[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium">{member.name || member.email}</div>
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1">{member.role}</Badge>
                                                </div>
                                            </div>
                                            {(currentRole === 'admin' || currentRole === 'manager') && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                                                    onClick={() => handleRemoveMember(member.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    {(!team.members || team.members.length === 0) && (
                                        <div className="text-sm text-center py-4 text-slate-400 italic">No members yet</div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Team Member</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Select onValueChange={setSelectedMemberId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a user" />
                            </SelectTrigger>
                            <SelectContent>
                                {allUsers.filter(u => !u.teamId).map((u) => (
                                    <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddMember} disabled={loading}>Add to Team</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
