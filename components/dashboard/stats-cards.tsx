"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserPlus, Flame, CheckCircle, Clock, Percent, AlertCircle } from "lucide-react"

export function StatsCards({ stats }: { stats: any }) {
    const cards = [
        { title: "Total Leads", value: stats.totalLeads, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "New Leads", value: stats.newLeads || 0, icon: UserPlus, color: "text-green-600", bg: "bg-green-50" },
        { title: "Hot Leads", value: stats.hotLeads || 0, icon: Flame, color: "text-red-600", bg: "bg-red-50" },
        { title: "Customers", value: stats.customers || 0, icon: CheckCircle, color: "text-purple-600", bg: "bg-purple-50" },
        { title: "Interested", value: stats.interested || 0, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
        { title: "Opportunities", value: stats.opportunities || 0, icon: Users, color: "text-orange-600", bg: "bg-orange-50" },
        { title: "Conversion Rate", value: `${stats.conversionRate || 0}%`, icon: Percent, color: "text-emerald-600", bg: "bg-emerald-50" },
        { title: "Open Tasks", value: stats.openTasks || 0, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
        { title: "Overdue Tasks", value: stats.overdueTasks || 0, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {cards.map((card) => (
                <Card key={card.title} className="shadow-sm border-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {card.title}
                        </CardTitle>
                        <div className={`p-2 rounded-full ${card.bg}`}>
                            <card.icon className={`h-4 w-4 ${card.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
