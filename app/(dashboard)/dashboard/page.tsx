
import { StatsCards } from "@/components/dashboard/stats-cards"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { DashboardFilters } from "@/components/dashboard/dashboard-filters"
import { subDays, startOfMonth, subMonths, endOfMonth, startOfDay, endOfDay } from "date-fns"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const session = await auth()
    const params = await searchParams

    // Parse filters
    const dateRange = (params.dateRange as string) || "30days"
    const requestedUserId = (params.userId as string) || "all"
    const statusFilter = (params.status as string) || "all"

    // 1. Fetch Current User and determine scope
    let currentUser: any = null
    if (session?.user?.email) {
        currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                managedTeam: {
                    include: { members: { select: { id: true } } }
                }
            }
        })
    }

    if (!currentUser) return null

    // Determine allowed userId filter
    let activeUserId = requestedUserId
    let allowedTeamIds: string[] = []

    if (currentUser.role === 'manager') {
        const teamMemberIds = (currentUser as any).managedTeam?.members.map((m: any) => m.id) || []
        teamMemberIds.push(currentUser.id)
        allowedTeamIds = teamMemberIds

        if (requestedUserId !== 'all') {
            if (!teamMemberIds.includes(requestedUserId)) {
                activeUserId = 'all'
            }
        }
    } else if (currentUser.role === 'sales') {
        activeUserId = currentUser.id
    }

    // 2. Fetch Profiles for Filter
    let profileQuery: any = {}
    if (currentUser.role === 'manager') {
        profileQuery = { id: { in: allowedTeamIds } }
    } else if (currentUser.role === 'sales') {
        profileQuery = { id: currentUser.id }
    }

    const profiles = await prisma.user.findMany({
        where: profileQuery,
        select: { id: true, name: true, email: true }
    }).then(users => users.map(u => ({ ...u, full_name: u.name })))

    // 3. Build Lead Query
    let startDate: Date | undefined
    let endDate: Date | undefined
    const now = new Date()

    if (dateRange === 'today') {
        startDate = startOfDay(now)
        endDate = endOfDay(now)
    } else if (dateRange === '7days') {
        startDate = subDays(now, 7)
    } else if (dateRange === '30days') {
        startDate = subDays(now, 30)
    } else if (dateRange === 'thisMonth') {
        startDate = startOfMonth(now)
    } else if (dateRange === 'lastMonth') {
        startDate = startOfMonth(subMonths(now, 1))
        endDate = endOfMonth(subMonths(now, 1))
    }

    const leadWhere: any = {}
    if (startDate) leadWhere.createdAt = { gte: startDate }
    if (endDate) leadWhere.createdAt = { ...leadWhere.createdAt, lte: endDate }
    else if (startDate) leadWhere.createdAt = { ...leadWhere.createdAt, lte: now }

    // User/Scope Filter
    if (currentUser.role === 'admin') {
        if (activeUserId !== 'all') {
            leadWhere.assignedToId = activeUserId === 'unassigned' ? null : activeUserId
        }
    } else if (currentUser.role === 'manager') {
        if (activeUserId === 'all') {
            leadWhere.assignedToId = { in: allowedTeamIds }
        } else {
            leadWhere.assignedToId = activeUserId
        }
    } else {
        leadWhere.assignedToId = currentUser.id
    }

    if (statusFilter !== 'all') {
        leadWhere.status = statusFilter
    }

    const leads = await prisma.lead.findMany({ where: leadWhere })

    // 4. Fetch Tasks
    const taskWhere: any = {}
    if (currentUser.role === 'admin') {
        if (activeUserId !== 'all' && activeUserId !== 'unassigned') {
            taskWhere.assignedToId = activeUserId
        }
    } else if (currentUser.role === 'manager') {
        if (activeUserId === 'all') {
            taskWhere.assignedToId = { in: allowedTeamIds }
        } else {
            taskWhere.assignedToId = activeUserId
        }
    } else {
        taskWhere.assignedToId = currentUser.id
    }

    const tasks = await prisma.task.findMany({ where: taskWhere })

    // --- METRICS CALCULATION ---
    const totalLeads = leads.length
    const newLeads = leads.filter((l) => l.status === 'Fresh Untouched').length
    const hotLeads = leads.filter((l) => l.status === 'Hot').length
    const customers = leads.filter((l) => l.status === 'Customer').length
    const interested = leads.filter((l) => l.status === 'Interested').length
    const opportunities = leads.filter((l) => l.status === 'Opportunity').length

    const conversionRate = totalLeads > 0 ? ((customers / totalLeads) * 100).toFixed(1) : "0"
    const openTasks = tasks.filter((t) => t.status !== 'done').length
    const overdueTasks = tasks.filter((t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now).length

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
    const dailyMap = new Map()
    let chartStart = startDate || (dateRange === 'all' ? subMonths(now, 3) : subDays(now, 30))
    let chartEnd = endDate || now

    for (let d = new Date(chartStart); d <= chartEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]
        dailyMap.set(dateStr, { date: dateStr, count: 0, converted: 0 })
    }

    leads.forEach((l) => {
        const dateStr = l.createdAt.toISOString().split('T')[0]
        if (dailyMap.has(dateStr)) {
            const entry = dailyMap.get(dateStr)
            entry.count += 1
            if (l.status === 'Customer') entry.converted += 1
        }
    })

    const dailyLeads = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }))

    const statusDistribution = Object.entries(leads.reduce((acc: any, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1
        return acc
    }, {})).map(([name, value]) => ({ name, value: value as number }))

    if (statusDistribution.length === 0) statusDistribution.push({ name: 'No Data', value: 1 })

    // User Performance
    const userMap = new Map()
    profiles.forEach((p) => userMap.set(p.id, { name: p.full_name || 'Unknown', leads: 0, conversions: 0 }))
    if (currentUser.role === 'admin') userMap.set('null', { name: 'Unassigned', leads: 0, conversions: 0 })

    leads.forEach((l) => {
        const uid = l.assignedToId || 'null'
        if (userMap.has(uid)) {
            const u = userMap.get(uid)
            u.leads += 1
            if (l.status === 'Customer') u.conversions += 1
        }
    })

    const userPerformance = Array.from(userMap.values()).filter(u => u.leads > 0 || u.conversions > 0)

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <DashboardFilters profiles={profiles as any[]} />
            </div>

            <StatsCards stats={stats} />
            <DashboardCharts data={{ dailyLeads, statusDistribution, userPerformance }} />
        </div>
    )
}
