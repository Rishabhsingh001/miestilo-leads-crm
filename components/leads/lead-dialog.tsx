"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { logActivity } from "@/lib/logger"

const formSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    company: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    profession: z.string().optional(),
    course_name: z.string().optional(),
    time_in_session: z.string().optional(),
    days_attended: z.string().optional(),
    bootcamp_attendee: z.enum(["yes", "no"]),
    status: z.string().min(1, "Status is required"),
    source: z.string().optional(),
    utm_source: z.string().optional(),
    utm_campaign: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_content: z.string().optional(),
    utm_term: z.string().optional(),
    notes: z.string().optional(),
})

export function LeadDialog() {
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            company: "",
            country: "",
            city: "",
            profession: "",
            course_name: "",
            time_in_session: "",
            days_attended: "0",
            bootcamp_attendee: "no" as "yes" | "no",
            status: "Fresh Untouched",
            source: "",
            utm_source: "",
            utm_campaign: "",
            utm_medium: "",
            utm_content: "",
            utm_term: "",
            notes: ""
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const { data: { user } } = await supabase.auth.getUser()

        // Check for duplicates
        if (values.email) {
            const { data: existingLead } = await supabase
                .from('leads')
                .select('id')
                .eq('email', values.email)
                .single()

            if (existingLead) {
                toast.error("A lead with this email already exists.")
                return
            }
        }

        const { data: newLead, error } = await supabase.from('leads').insert({
            ...values,
            days_attended: values.days_attended ? parseInt(values.days_attended) || 0 : 0,
            bootcamp_attendee: values.bootcamp_attendee === 'yes',
            created_by: user?.id,
            assigned_to: user?.id
        }).select().single()

        if (error) {
            toast.error("Failed to create lead: " + error.message)
            return
        }

        if (newLead) {
            await logActivity('Lead Created', 'lead', newLead.id, { name: newLead.name })
        }

        toast.success("Lead created successfully")
        setOpen(false)
        form.reset()
        router.refresh()
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Lead
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden flex flex-col">
                <DialogHeader className="p-6 pb-2 shrink-0">
                    <DialogTitle>Add New Lead</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1 px-6 pb-6 w-full">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel>Lead Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="contact@company.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone</FormLabel>
                                            <FormControl>
                                                <Input placeholder="+1 (555) 000-0000" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="company"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Company name (optional)" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="country"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Country</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., United States" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>City</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., New York" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Professional Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="profession"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Profession</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Software Engineer" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="course_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Course Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Web Development" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="time_in_session"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Time in Session</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., 2 hours" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="days_attended"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Days Attended</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bootcamp_attendee"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel>Bootcamp Attendee</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    className="flex flex-row space-x-4"
                                                >
                                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value="yes" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">
                                                            Yes
                                                        </FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value="no" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">
                                                            No
                                                        </FormLabel>
                                                    </FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Status & Source */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Fresh Untouched">Fresh Untouched</SelectItem>
                                                    <SelectItem value="Interested">Interested</SelectItem>
                                                    <SelectItem value="Not Interested">Not Interested</SelectItem>
                                                    <SelectItem value="Opportunity">Opportunity</SelectItem>
                                                    <SelectItem value="Hot">Hot</SelectItem>
                                                    <SelectItem value="DNP">DNP</SelectItem>
                                                    <SelectItem value="Invalid">Invalid</SelectItem>
                                                    <SelectItem value="Customer">Customer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="source"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Lead Source</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value || "Select source"}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select source" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Google">Google</SelectItem>
                                                    <SelectItem value="Facebook">Facebook</SelectItem>
                                                    <SelectItem value="Instagram">Instagram</SelectItem>
                                                    <SelectItem value="Referral">Referral</SelectItem>
                                                    <SelectItem value="Manual">Manual</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Notes */}
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Add any additional notes..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Hidden submit button to allow form submission on Enter */}
                            <button type="submit" className="hidden" />
                        </form>
                    </Form>
                </ScrollArea>
                <DialogFooter className="p-6 border-t bg-white shrink-0 z-10 w-full mb-0">
                    <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={form.handleSubmit(onSubmit)}>Create Lead</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
