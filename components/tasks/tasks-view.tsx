"use client"

import { useState } from "react"
import { TaskDialog } from "./task-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, isToday, isPast, isTomorrow } from "date-fns"
import { CheckCircle2, Circle, Clock, AlertCircle, Search, Calendar as CalendarIcon, Filter, MoreHorizontal } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { logActivity } from "@/lib/logger"

interface TasksViewProps {
    initialTasks: any[]
}

export function TasksView({ initialTasks }: TasksViewProps) {
    const [tasks, setTasks] = useState(initialTasks)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [priorityFilter, setPriorityFilter] = useState("all")
    const [activeTab, setActiveTab] = useState("all")
    const router = useRouter()
    const supabase = createClient()

    const refreshTasks = async () => {
        const { data } = await supabase
            .from('tasks')
            .select('*, assignee:profiles!assigned_to(full_name, email), lead:leads(name)')
            .order('due_date', { ascending: true })
        if (data) setTasks(data)
        router.refresh()
    }

    async function toggleStatus(task: any) {
        const newStatus = task.status === 'done' ? 'pending' : 'done'
        const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
        if (error) {
            toast.error("Failed to update task")
        } else {
            if (newStatus === 'done') {
                await logActivity('Task Completed', 'task', task.id, { title: task.title })
            }
            toast.success(newStatus === 'done' ? "Task completed" : "Task re-opened")
            refreshTasks()
        }
    }

    async function deleteTask(id: string) {
        const { error } = await supabase.from('tasks').delete().eq('id', id)
        if (error) toast.error("Failed to delete")
        else {
            toast.success("Task deleted")
            refreshTasks()
        }
    }

    // Filter Logic
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) ||
            task.description?.toLowerCase().includes(search.toLowerCase()) ||
            task.lead?.name?.toLowerCase().includes(search.toLowerCase())

        const matchesStatus = statusFilter === 'all' || task.status === statusFilter
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter

        // Tab logic overrides some filters or acts as a preset
        let matchesTab = true
        if (activeTab === 'today') {
            matchesTab = task.due_date && isToday(new Date(task.due_date)) && task.status !== 'done'
        } else if (activeTab === 'pending') {
            matchesTab = task.status !== 'done'
        } else if (activeTab === 'overdue') {
            matchesTab = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && task.status !== 'done'
        } else if (activeTab === 'done') {
            matchesTab = task.status === 'done'
        }

        return matchesSearch && matchesStatus && matchesPriority && matchesTab
    })

    // Stats
    const stats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        done: tasks.filter(t => t.status === 'done').length,
        today: tasks.filter(t => t.due_date && isToday(new Date(t.due_date)) && t.status !== 'done').length
    }

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Due Today</CardTitle>
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.today}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pending}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.inProgress}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.done}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                    <TabsList>
                        <TabsTrigger value="all">All Tasks</TabsTrigger>
                        <TabsTrigger value="today">Today</TabsTrigger>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="overdue">Overdue</TabsTrigger>
                        <TabsTrigger value="done">Completed</TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <TaskDialog onSuccess={refreshTasks} />
                </div>
            </div>

            {/* Detailed Filters (Optional, collapsible?) */}
            {activeTab === 'all' && (
                <div className="flex gap-2 items-center">
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-[130px] h-8">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priority</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[130px] h-8">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                    </Select>
                    {(priorityFilter !== 'all' || statusFilter !== 'all') && (
                        <Button variant="ghost" size="sm" onClick={() => { setPriorityFilter('all'); setStatusFilter('all') }}>
                            Reset
                        </Button>
                    )}
                </div>
            )}

            {/* Task List */}
            <div className="space-y-2">
                {filteredTasks.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg bg-muted/10">
                        <p className="text-muted-foreground">No tasks found matching your filters.</p>
                    </div>
                ) : (
                    filteredTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex items-start gap-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`mt-0.5 h-6 w-6 rounded-full shrink-0 ${task.status === 'done' ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground hover:text-primary'}`}
                                    onClick={() => toggleStatus(task)}
                                >
                                    {task.status === 'done' ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                                </Button>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                                            {task.title}
                                        </span>
                                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize ${task.priority === 'high' ? 'border-red-200 text-red-700 bg-red-50' :
                                            task.priority === 'medium' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' :
                                                'text-muted-foreground'
                                            }`}>
                                            {task.priority}
                                        </Badge>
                                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize ${task.status === 'done' ? 'bg-green-50 text-green-700 border-green-200' :
                                            task.status === 'in-progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                'bg-slate-50 text-slate-600'
                                            }`}>
                                            {task.status}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                                        {task.due_date && (
                                            <span className={`flex items-center gap-1 ${!task.status.includes('done') && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) ? 'text-red-600 font-medium' : ''}`}>
                                                <CalendarIcon className="h-3 w-3" />
                                                {format(new Date(task.due_date), "MMM d, yyyy")}
                                                {isToday(new Date(task.due_date)) && " (Today)"}
                                            </span>
                                        )}
                                        {task.lead && (
                                            <span className="flex items-center gap-1">
                                                <span className="opacity-70">Lead:</span> {task.lead.name}
                                            </span>
                                        )}
                                        {task.assignee && (
                                            <span className="flex items-center gap-1">
                                                <span className="opacity-70">Assigned:</span> {task.assignee.full_name || task.assignee.email}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <TaskDialog
                                    trigger={<Button variant="ghost" size="sm">Edit</Button>}
                                    task={task}
                                    onSuccess={refreshTasks}
                                />
                                <AlertDialog>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem className="text-red-600" onSelect={(e) => e.preventDefault()}>
                                                    Delete Task
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the task.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => deleteTask(task.id)} className="bg-red-600 hover:bg-red-700">
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
