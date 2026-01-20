import { createClient } from "@/lib/supabase/server"
import { LeadsTable } from "@/components/leads/leads-table"
import { LeadDialog } from "@/components/leads/lead-dialog"
import { LeadImportDialog } from "@/components/leads/lead-import-dialog"
import { DeleteAllLeadsButton } from "@/components/leads/delete-all-leads-button"

export default async function LeadsPage() {
    const supabase = await createClient()

    // Fetch leads and profiles separately to avoid ambiguous relationship errors
    // Fetch all leads in chunks
    let allLeads: any[] = []
    let hasMore = true
    let page = 0
    const pageSize = 1000

    while (hasMore) {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1)

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

    const leadsData = allLeads

    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')

    // Get current user role for permissions
    const { data: { user } } = await supabase.auth.getUser()
    let userRole = 'sales'
    if (user) {
        const { data: currentUserProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (currentUserProfile) userRole = currentUserProfile.role
    }

    if (profilesError) {
        console.error("Error loading data:", profilesError)
        return (
            <div className="p-8 text-center text-red-500">
                <h2 className="text-xl font-bold">Error Loading Leads</h2>
                <p>{profilesError?.message}</p>
            </div>
        )
    }

    // Manually join profiles to leads
    const leads = leadsData?.map(lead => ({
        ...lead,
        assignee: profiles?.find(p => p.id === lead.assigned_to) || null
    }))

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <DeleteAllLeadsButton userRole={userRole} />
                    <LeadImportDialog />
                    <LeadDialog />
                </div>
            </div>
            <LeadsTable initialLeads={leads || []} profiles={profiles || []} />
        </div>
    )
}
