"use client"
import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { format, subDays, isAfter, parseISO } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { bulkUpdateStatus, bulkAssign, bulkDelete } from "@/app/actions/leads"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Loader2, UserPlus, Trash2 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logActivity } from "@/lib/logger"
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

export function LeadsTable({ initialLeads, profiles = [] }: { initialLeads: any[], profiles?: any[] }) {
    const router = useRouter()
    // const supabase = createClient() // Removed
    const [search, setSearch] = useState("")
    const [selectedLeads, setSelectedLeads] = useState<string[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [updating, setUpdating] = useState(false)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [ownerFilter, setOwnerFilter] = useState<string>("all")
    const [dateFilter, setDateFilter] = useState<string>("all")

    // Filter Logic
    const filteredLeads = initialLeads.filter(lead => {
        const matchesSearch =
            lead.name.toLowerCase().includes(search.toLowerCase()) ||
            lead.email?.toLowerCase().includes(search.toLowerCase()) ||
            lead.phone?.includes(search)

        const matchesStatus = statusFilter === "all" || lead.status === statusFilter

        let matchesOwner = true
        if (ownerFilter !== "all") {
            if (ownerFilter === "unassigned") {
                matchesOwner = !lead.assigned_to
            } else {
                matchesOwner = lead.assigned_to === ownerFilter
            }
        }

        let matchesDate = true
        if (dateFilter !== "all") {
            const createdAt = new Date(lead.created_at)
            const today = new Date()
            if (dateFilter === "today") {
                matchesDate = format(createdAt, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
            } else if (dateFilter === "7days") {
                matchesDate = isAfter(createdAt, subDays(today, 7))
            } else if (dateFilter === "30days") {
                matchesDate = isAfter(createdAt, subDays(today, 30))
            }
        }

        return matchesSearch && matchesStatus && matchesOwner && matchesDate
    })

    // Pagination Logic
    const totalPages = Math.ceil(filteredLeads.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedLeads = filteredLeads.slice(startIndex, startIndex + itemsPerPage)

    // Selection Logic
    const toggleSelectAll = () => {
        if (selectedLeads.length === paginatedLeads.length) {
            setSelectedLeads([])
        } else {
            setSelectedLeads(paginatedLeads.map(l => l.id))
        }
    }

    const toggleSelectLead = (id: string) => {
        if (selectedLeads.includes(id)) {
            setSelectedLeads(selectedLeads.filter(l => l !== id))
        } else {
            setSelectedLeads([...selectedLeads, id])
        }
    }

    // Bulk Update Logic
    const handleBulkStatusUpdate = async (newStatus: string) => {
        if (!selectedLeads.length) return

        setUpdating(true)
        const { success, error } = await bulkUpdateStatus(selectedLeads, newStatus)

        if (error) {
            toast.error("Failed to update leads: " + error)
        } else {
            // Log for each lead
            for (const leadId of selectedLeads) {
                await logActivity('Status Changed', 'lead', leadId, { to: newStatus, bulk: true })
            }
            toast.success(`Updated ${selectedLeads.length} leads to ${newStatus}`)
            setSelectedLeads([])
            router.refresh()
        }
        setUpdating(false)
    }

    const handleBulkAssign = async (userId: string) => {
        if (!selectedLeads.length) return

        setUpdating(true)
        const { success, error } = await bulkAssign(selectedLeads, userId)

        if (error) {
            toast.error("Failed to assign leads: " + error)
        } else {
            const assigneeName = profiles.find(p => p.id === userId)?.full_name || "User"
            // Log for each lead
            for (const leadId of selectedLeads) {
                await logActivity('Lead Assigned', 'lead', leadId, { to: userId, bulk: true })
            }
            toast.success(`Assigned ${selectedLeads.length} leads to ${assigneeName}`)
            setSelectedLeads([])
            router.refresh()
        }
        setUpdating(false)
    }

    // Bulk Delete Logic
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    const handleBulkDelete = async () => {
        if (!selectedLeads.length) return

        setUpdating(true)
        const { success, error } = await bulkDelete(selectedLeads)

        if (error) {
            toast.error("Failed to delete leads: " + error)
        } else {
            // Log for each lead
            for (const leadId of selectedLeads) {
                await logActivity('Lead Deleted', 'lead', leadId, { bulk: true })
            }
            toast.success(`Deleted ${selectedLeads.length} leads`)
            setSelectedLeads([])
            router.refresh()
        }
        setUpdating(false)
        setDeleteDialogOpen(false)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Hot': return 'bg-red-500 hover:bg-red-600'
            case 'Fresh Untouched': return 'bg-blue-500 hover:bg-blue-600'
            case 'Customer': return 'bg-green-500 hover:bg-green-600'
            case 'Interested': return 'bg-yellow-500 hover:bg-yellow-600'
            case 'Opportunity': return 'bg-orange-500 hover:bg-orange-600'
            case 'DNP': return 'bg-gray-500 hover:bg-gray-600'
            case 'Invalid': return 'bg-slate-700 hover:bg-slate-800'
            default: return 'bg-slate-500 hover:bg-slate-600'
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2 w-full">
                        <Input
                            placeholder="Search leads..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            className="max-w-[200px]"
                        />

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
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

                        {/* Owner Filter */}
                        <Select value={ownerFilter} onValueChange={(val) => { setOwnerFilter(val); setCurrentPage(1); }}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Owner" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Owners</SelectItem>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {profiles.map(profile => (
                                    <SelectItem key={profile.id} value={profile.id}>{profile.full_name || profile.email}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Date Filter */}
                        <Select value={dateFilter} onValueChange={(val) => { setDateFilter(val); setCurrentPage(1); }}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Date" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="7days">Last 7 Days</SelectItem>
                                <SelectItem value="30days">Last 30 Days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedLeads.length > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ml-auto">
                            <span className="text-sm font-medium whitespace-nowrap">{selectedLeads.length} selected</span>

                            {/* Bulk Status */}
                            <Select onValueChange={handleBulkStatusUpdate} disabled={updating}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Set Status" />
                                </SelectTrigger>
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

                            {/* Bulk Assign */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" disabled={updating}>
                                        <UserPlus className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Assign to...</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {profiles.map(profile => (
                                        <DropdownMenuItem key={profile.id} onClick={() => handleBulkAssign(profile.id)}>
                                            {profile.full_name || profile.email}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Bulk Delete */}
                            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon" disabled={updating}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete {selectedLeads.length} selected leads.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            {updating ? "Deleting..." : "Delete"}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            {updating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        </div>
                    )}
                </div>
            </div>

            <div className="border rounded-md bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px]">
                                <Checkbox
                                    checked={paginatedLeads.length > 0 && selectedLeads.length === paginatedLeads.length}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="hidden md:table-cell">Company</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="hidden lg:table-cell">Source</TableHead>
                            <TableHead className="hidden md:table-cell">Phone</TableHead>
                            <TableHead className="hidden md:table-cell">Assigned To</TableHead>
                            <TableHead className="hidden lg:table-cell">Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedLeads.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                                    No leads found matching your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedLeads.map((lead) => (
                                <TableRow key={lead.id} className="cursor-pointer hover:bg-slate-50" onClick={() => router.push(`/leads/${lead.id}`)}>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={selectedLeads.includes(lead.id)}
                                            onCheckedChange={() => toggleSelectLead(lead.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="font-semibold">{lead.name}</div>
                                        <div className="text-xs text-muted-foreground">{lead.email}</div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {lead.company ? (
                                            <div className="font-medium">{lead.company}</div>
                                        ) : <span className="text-muted-foreground">-</span>}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">{lead.source || '-'}</TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {lead.phone || <span className="text-muted-foreground">-</span>}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {lead.assignee?.full_name ? (
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">
                                                    {lead.assignee.full_name[0]}
                                                </div>
                                                <span className="text-sm">{lead.assignee.full_name}</span>
                                            </div>
                                        ) : <span className="text-muted-foreground text-sm">Unassigned</span>}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">{format(new Date(lead.created_at), 'MMM d, yyyy')}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/leads/${lead.id}`) }}>View</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 0 && (
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground mr-2">Rows per page</p>
                        <Select
                            value={String(itemsPerPage)}
                            onValueChange={(val) => {
                                setItemsPerPage(Number(val))
                                setCurrentPage(1)
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={String(itemsPerPage)} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 50, 100, 200, 500].map((pageSize) => (
                                    <SelectItem key={pageSize} value={String(pageSize)}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages || 1} ({filteredLeads.length} total)
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )
            }
        </div >
    )
}
