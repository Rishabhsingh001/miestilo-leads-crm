import { createClient } from "@/lib/supabase/server"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { DashboardFilters } from "@/components/dashboard/dashboard-filters"
import { subDays, startOfMonth, subMonths, endOfMonth, isSameDay, parseISO, startOfDay, endOfDay } from "date-fns"

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const supabase = await createClient()

    // Parse filters
    const dateRange = (searchParams.dateRange as string) || "30days"
    const userId = (searchParams.userId as string) || "all"
    const statusFilter = (searchParams.status as string) || "all"

    // 1. Fetch Profiles for Filter
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, email')

    // 2. Build Date Query
    let startDate: Date | null = subDays(new Date(), 30) // default
    let endDate: Date | null = new Date()

    if (dateRange === 'today') {
        startDate = startOfDay(new Date())
        endDate = endOfDay(new Date())
    } else if (dateRange === '7days') {
        startDate = subDays(new Date(), 7)
    } else if (dateRange === '30days') {
        startDate = subDays(new Date(), 30)
    } else if (dateRange === 'thisMonth') {
        startDate = startOfMonth(new Date())
    } else if (dateRange === 'lastMonth') {
        startDate = startOfMonth(subMonths(new Date(), 1))
        endDate = endOfMonth(subMonths(new Date(), 1))
    } else if (dateRange === 'all') {
        startDate = null
        endDate = null
    }

    // 3. Fetch Leads
    // 3. Fetch Leads with Pagination (to bypass 1000 row limit)
    let allLeads: any[] = []
    let hasMore = true
    let page = 0
    const pageSize = 1000

    while (hasMore) {
        let query = supabase.from('leads').select('*').range(page * pageSize, (page + 1) * pageSize - 1)

        if (startDate) query = query.gte('created_at', startDate.toISOString())
        if (endDate && dateRange !== 'today' && dateRange !== 'all') query = query.lte('created_at', endDate.toISOString())

        // User Filter
        if (userId !== 'all') {
            if (userId === 'unassigned') query = query.is('assigned_to', null)
            else query = query.eq('assigned_to', userId)
        }

        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter)
        }

        const { data, error } = await query

        if (error) {
            console.error("Error fetching leads chunk:", error)
            break
        }

        if (data) {
            allLeads = [...allLeads, ...data]
            if (data.length < pageSize) hasMore = false
        } else {
            hasMore = false
        }
        page++
    }

    const leads = allLeads

    // 4. Fetch Tasks (Open & Overdue)
    // Tasks generally relate to the user or all if admin. For simplicity, we filter tasks by assignee if userId is selected.
    let taskQuery = supabase.from('tasks').select('*')
    if (userId !== 'all' && userId !== 'unassigned') taskQuery = taskQuery.eq('assigned_to', userId)

    // Date filter on tasks? Usually dashboard tasks are "what's active now", regardless of creation date.
    // But "Overdue" implies due date.
    const { data: tasks = [] } = await taskQuery

    // --- METRICS CALCULATION ---

    const totalLeads = leads?.length || 0
    const newLeads = leads?.filter((l: any) => l.status === 'Fresh Untouched').length || 0
    const hotLeads = leads?.filter((l: any) => l.status === 'Hot').length || 0
    const customers = leads?.filter((l: any) => l.status === 'Customer').length || 0
    const interested = leads?.filter((l: any) => l.status === 'Interested').length || 0
    const opportunities = leads?.filter((l: any) => l.status === 'Opportunity').length || 0

    // Calculate conversion rate: Customers / Total (avoid division by zero)
    const conversionRate = totalLeads > 0 ? ((customers / totalLeads) * 100).toFixed(1) : "0"

    const openTasks = tasks?.filter((t: any) => t.status !== 'done').length || 0
    const overdueTasks = tasks?.filter((t: any) => t.status !== 'done' && new Date(t.due_date) < new Date()).length || 0

    const stats = {
        totalLeads,
        newLeads,
        hotLeads,
        customers,
        interested,
        opportunities,
        conversionRate,
        openTasks,
        overdueTasks
    }

    // --- CHART DATA PREPARATION ---

    // 1. Lead Trend (Daily) & Daily Converted
    // Generate array of dates between start and end (or last 30 days if 'all')
    const chartDays = []
    let current = startDate || subDays(new Date(), 30) // fallback for 'all' to show something reasonable
    let end = endDate || new Date()

    // Limit 'all' chart to last 3 months to avoid over-crowding
    if (dateRange === 'all') {
        current = subMonths(new Date(), 3)
    }

    const dailyMap = new Map()

    // Populate map with zero-data dates
    for (let d = new Date(current); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]
        dailyMap.set(dateStr, { date: dateStr, count: 0, converted: 0 })
    }

    leads?.forEach((l: any) => {
        const dateStr = l.created_at.split('T')[0]
        if (dailyMap.has(dateStr)) {
            const entry = dailyMap.get(dateStr)
            entry.count += 1
            if (l.status === 'Customer') {
                entry.converted += 1
            }
        }
    })

    // Convert map to sorted array
    const dailyLeads = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }))

    // 2. Status Distribution
    const statusCounts: { [key: string]: number } = {}
    leads?.forEach((l: any) => {
        statusCounts[l.status] = (statusCounts[l.status] || 0) + 1
    })

    const statusDistribution = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
    if (statusDistribution.length === 0) statusDistribution.push({ name: 'No Data', value: 1 })

    // 3. User Performance
    // Map leads to users. If userId filter is on, this will show just one bar.
    const userMap = new Map()

    // Initialize with all profiles if no specific user filter, or just the one.
    if (userId === 'all') {
        profiles?.forEach((p: any) => userMap.set(p.id, { name: p.full_name || 'Unknown', leads: 0, conversions: 0 }))
        userMap.set('null', { name: 'Unassigned', leads: 0, conversions: 0 }) // For unassigned
    } else {
        const p = profiles?.find((x: any) => x.id === userId)
        if (p) userMap.set(userId, { name: p.full_name, leads: 0, conversions: 0 })
    }

    leads?.forEach((l: any) => {
        const uid = l.assigned_to || 'null'
        // If we are filtering by user, we only care about that user (logic handled by query mostly, but strict check here)
        if (userMap.has(uid)) {
            const u = userMap.get(uid)
            u.leads += 1
            if (l.status === 'Customer') u.conversions += 1
        }
    })

    const userPerformance = Array.from(userMap.values()).filter(u => u.leads > 0 || u.conversions > 0)

    const chartData = {
        dailyLeads,
        statusDistribution,
        userPerformance
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <DashboardFilters profiles={profiles || []} />
            </div>

            <StatsCards stats={stats} />
            <DashboardCharts data={chartData} />
        </div>
    )
}
