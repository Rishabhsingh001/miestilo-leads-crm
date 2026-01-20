"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { logActivity } from "@/lib/logger"

const formSchema = z.object({
    title: z.string().min(2, "Title is required"),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']),
    status: z.enum(['pending', 'in-progress', 'done']),
    due_date: z.date().optional(),
    assigned_to: z.string().optional(),
    lead_id: z.string().optional(),
})

interface TaskDialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    trigger?: React.ReactNode
    onSuccess?: () => void
    task?: any
}

export function TaskDialog({ open, onOpenChange, trigger, onSuccess, task }: TaskDialogProps) {
    const [dialogOpen, setDialogOpen] = useState(open || false)
    const [profiles, setProfiles] = useState<any[]>([])
    const [leads, setLeads] = useState<any[]>([])
    const [loadingData, setLoadingData] = useState(false)
    const supabase = createClient()

    // Sync open state
    useEffect(() => {
        if (open !== undefined) setDialogOpen(open)
    }, [open])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: task?.title || "",
            description: task?.description || "",
            priority: task?.priority || "medium",
            status: task?.status || "pending",
            due_date: task?.due_date ? new Date(task.due_date) : undefined,
            assigned_to: task?.assigned_to || "",
            lead_id: task?.lead_id || "",
        },
    })

    // Reset form when task changes or dialog opens
    useEffect(() => {
        if (dialogOpen) {
            form.reset({
                title: task?.title || "",
                description: task?.description || "",
                priority: task?.priority || "medium",
                status: task?.status || "pending",
                due_date: task?.due_date ? new Date(task.due_date) : undefined,
                assigned_to: task?.assigned_to || "",
                lead_id: task?.lead_id || "",
            })
            fetchData()
        }
    }, [dialogOpen, task, form])

    async function fetchData() {
        setLoadingData(true)
        // Fetch profiles
        const { data: profilesData } = await supabase.from('profiles').select('id, full_name, email')
        setProfiles(profilesData || [])

        // Fetch leads (limit to top 100 for now or search logic needed for large datasets)
        const { data: leadsData } = await supabase.from('leads').select('id, name, company').order('created_at', { ascending: false }).limit(50)
        setLeads(leadsData || [])
        setLoadingData(false)
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const { data: { user } } = await supabase.auth.getUser()

        const payload: any = {
            title: values.title,
            description: values.description,
            priority: values.priority,
            status: values.status,
            due_date: values.due_date ? values.due_date.toISOString() : null,
            assigned_to: (values.assigned_to === 'unassigned' || !values.assigned_to) ? null : values.assigned_to,
            lead_id: (values.lead_id === 'unlinked' || !values.lead_id) ? null : values.lead_id,
        }

        let error
        let finalTask: any
        if (task?.id) {
            const { data, error: updateError } = await supabase.from('tasks').update(payload).eq('id', task.id).select().single()
            error = updateError
            finalTask = data
        } else {
            payload.created_by = user?.id
            const { data, error: insertError } = await supabase.from('tasks').insert(payload).select().single()
            error = insertError
            finalTask = data
        }

        if (error) {
            console.error("Task Save Error:", error)
            toast.error(`Failed to save task: ${error.message}`)
            return
        }

        if (!task?.id && finalTask) {
            await logActivity('Task Created', 'task', finalTask.id, { title: finalTask.title })
        } else if (task?.id && finalTask && task.status !== finalTask.status && finalTask.status === 'done') {
            await logActivity('Task Completed', 'task', finalTask.id, { title: finalTask.title })
        }

        toast.success(task?.id ? "Task updated" : "Task created")
        setDialogOpen(false)
        onOpenChange?.(false)
        onSuccess?.()
    }

    return (
        <Dialog open={dialogOpen} onOpenChange={(val) => {
            setDialogOpen(val)
            onOpenChange?.(val)
        }}>
            <DialogTrigger asChild>
                {trigger || <Button><Plus className="mr-2 h-4 w-4" /> Add Task</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Task title" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Priority</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Priority" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="in-progress">In Progress</SelectItem>
                                                <SelectItem value="done">Done</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="due_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Due Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="assigned_to"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Assign To</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Unassigned" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                                {profiles.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="lead_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Link Lead</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select lead (optional)" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="unlinked">No Lead Linked</SelectItem>
                                            {leads.map((lead) => (
                                                <SelectItem key={lead.id} value={lead.id}>
                                                    {lead.name}
                                                    {lead.company && <span className="text-muted-foreground text-xs ml-1">({lead.company})</span>}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Task details..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button type="submit">{task ? "Save Changes" : "Create Task"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
