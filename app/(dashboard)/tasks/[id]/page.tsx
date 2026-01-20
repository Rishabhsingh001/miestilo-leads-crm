"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowLeft, Save, Trash2, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function EditTaskPage() {
    const router = useRouter()
    const params = useParams()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [task, setTask] = useState<any>(null)

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        priority: "medium",
        status: "pending",
        due_date: undefined as Date | undefined,
    })

    useEffect(() => {
        async function fetchTask() {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('id', params.id)
                .single()

            if (error) {
                toast.error("Could not fetch task")
                router.push("/tasks")
                return
            }

            setTask(data)
            setFormData({
                title: data.title || "",
                description: data.description || "",
                priority: data.priority || "medium",
                status: data.status || "pending",
                due_date: data.due_date ? new Date(data.due_date) : undefined
            })
            setLoading(false)
        }
        fetchTask()
    }, [params.id, router, supabase])

    async function handleSave() {
        setSaving(true)
        const { error } = await supabase
            .from('tasks')
            .update({
                ...formData,
                due_date: formData.due_date ? formData.due_date.toISOString() : null
            })
            .eq('id', params.id)

        if (error) {
            toast.error("Failed to update task")
        } else {
            toast.success("Task updated successfully")
            router.refresh()
        }
        setSaving(false)
    }

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this task?")) return

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', params.id)

        if (error) {
            toast.error("Failed to delete task.")
        } else {
            toast.success("Task deleted")
            router.push("/tasks")
        }
    }

    if (loading) return <div className="p-8">Loading...</div>

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold">Edit Task</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="grid gap-2">
                        <Label>Title</Label>
                        <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Description</Label>
                        <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Priority</Label>
                            <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in-progress">In Progress</SelectItem>
                                    <SelectItem value="done">Done</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Due Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !formData.due_date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.due_date ? format(formData.due_date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={formData.due_date}
                                    onSelect={(date) => setFormData({ ...formData, due_date: date })}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
