"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, FilterX } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export function DashboardFilters({ profiles }: { profiles: any[] }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [dateRange, setDateRange] = useState<string>(searchParams.get("dateRange") || "30days")
    const [userId, setUserId] = useState<string>(searchParams.get("userId") || "all")
    const [status, setStatus] = useState<string>(searchParams.get("status") || "all")

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams()
        if (dateRange && dateRange !== "all") params.set("dateRange", dateRange)
        if (userId && userId !== "all") params.set("userId", userId)
        if (status && status !== "all") params.set("status", status)

        router.push(`/dashboard?${params.toString()}`)
    }, [dateRange, userId, status, router])

    const clearFilters = () => {
        setDateRange("30days")
        setUserId("all")
        setStatus("all")
        router.push("/dashboard")
    }

    return (
        <div className="flex flex-wrap items-center gap-2 mb-6 p-4 bg-white rounded-lg border shadow-sm">
            <span className="text-sm font-medium text-muted-foreground mr-2">Filters:</span>

            {/* Date Range Filter */}
            <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px]">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Select Date Range" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
            </Select>

            {/* User Filter */}
            <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {profiles.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Fresh Untouched">Fresh Untouched</SelectItem>
                    <SelectItem value="Interested">Interested</SelectItem>
                    <SelectItem value="Opportunity">Opportunity</SelectItem>
                    <SelectItem value="Hot">Hot</SelectItem>
                    <SelectItem value="Customer">Customer</SelectItem>
                    <SelectItem value="DNP">DNP</SelectItem>
                    <SelectItem value="Invalid">Invalid</SelectItem>
                </SelectContent>
            </Select>

            {(dateRange !== "30days" || userId !== "all" || status !== "all") && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
                    <FilterX className="h-4 w-4 mr-2" /> Reset
                </Button>
            )}
        </div>
    )
}
