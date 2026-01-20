"use client"

import { useState, useEffect, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, isToday, isWithinInterval, startOfWeek, startOfMonth, endOfDay } from "date-fns"
import { Search, Filter, Clock, User, Tag } from "lucide-react"
import { useSearchParams } from "next/navigation"

interface ActivityLogsViewProps {
    initialLogs: any[]
}

function ActivityLogsContent({ initialLogs }: ActivityLogsViewProps) {
    const searchParams = useSearchParams()
    const [search, setSearch] = useState(searchParams.get('search') || "")
    const [dateFilter, setDateFilter] = useState("all")

    useEffect(() => {
        const querySearch = searchParams.get('search')
        if (querySearch) {
            setSearch(querySearch)
        }
    }, [searchParams])

    const filteredLogs = initialLogs.filter(log => {
        const matchesSearch =
            log.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            log.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
            log.action.toLowerCase().includes(search.toLowerCase()) ||
            log.entity_type.toLowerCase().includes(search.toLowerCase())

        let matchesDate = true
        const logDate = new Date(log.created_at)
        const now = new Date()

        if (dateFilter === 'today') {
            matchesDate = isToday(logDate)
        } else if (dateFilter === 'week') {
            matchesDate = isWithinInterval(logDate, {
                start: startOfWeek(now),
                end: endOfDay(now)
            })
        } else if (dateFilter === 'month') {
            matchesDate = isWithinInterval(logDate, {
                start: startOfMonth(now),
                end: endOfDay(now)
            })
        }

        return matchesSearch && matchesDate
    })

    const getActionColor = (action: string) => {
        if (action.includes('Created')) return 'bg-green-50 text-green-700 border-green-200'
        if (action.includes('Updated')) return 'bg-blue-50 text-blue-700 border-blue-200'
        if (action.includes('Deleted')) return 'bg-red-50 text-red-700 border-red-200'
        if (action.includes('Status')) return 'bg-amber-50 text-amber-700 border-amber-200'
        if (action.includes('Assigned')) return 'bg-purple-50 text-purple-700 border-purple-200'
        if (action.includes('Login')) return 'bg-slate-50 text-slate-700 border-slate-200'
        if (action.includes('Logout')) return 'bg-slate-50 text-slate-700 border-slate-200'
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by user or action..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="h-4 w-4 text-muted-foreground mr-2" />
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Date Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[250px]">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" /> User
                                </div>
                            </TableHead>
                            <TableHead>
                                <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4" /> Action
                                </div>
                            </TableHead>
                            <TableHead className="hidden md:table-cell">Entity</TableHead>
                            <TableHead className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Clock className="h-4 w-4" /> Time
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                    No activity logs found for the selected filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLogs.map((log) => (
                                <TableRow key={log.id} className="hover:bg-muted/5 transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-900">{log.user?.full_name || 'System'}</span>
                                            <span className="text-xs text-muted-foreground">{log.user?.email || 'N/A'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`font-medium ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-medium uppercase text-slate-500 tracking-wider">{log.entity_type}</span>
                                            {log.details?.name || log.details?.title ? (
                                                <span className="text-sm font-medium text-slate-700">
                                                    {log.details?.name || log.details?.title}
                                                </span>
                                            ) : log.entity_id ? (
                                                <span className="text-[10px] font-mono text-slate-400">
                                                    ID: {log.entity_id.substring(0, 8)}...
                                                </span>
                                            ) : null}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-medium text-slate-700">
                                                {format(new Date(log.created_at), 'MMM d, yyyy')}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(log.created_at), 'hh:mm a')}
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}

export function ActivityLogsView(props: ActivityLogsViewProps) {
    return (
        <Suspense fallback={<div>Loading activity logs...</div>}>
            <ActivityLogsContent {...props} />
        </Suspense>
    )
}
