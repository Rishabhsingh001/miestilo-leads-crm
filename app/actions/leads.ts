
"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { logActivityAction } from "@/app/actions"

const prisma = new PrismaClient()

export async function bulkUpdateStatus(leadIds: string[], status: string) {
    try {
        await prisma.lead.updateMany({
            where: {
                id: { in: leadIds }
            },
            data: { status }
        })
        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, error: 'Failed to update status' }
    }
}

export async function bulkAssign(leadIds: string[], userId: string) {
    try {
        await prisma.lead.updateMany({
            where: {
                id: { in: leadIds }
            },
            data: { assignedToId: userId }
        })
        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, error: 'Failed to assign leads' }
    }
}

export async function bulkDelete(leadIds: string[]) {
    try {
        const session = await auth()
        if (!session?.user?.email) return { success: false, error: 'Unauthorized' }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { role: true }
        })

        if (user?.role !== 'admin') {
            return { success: false, error: 'Permission denied. Only Admins can delete leads in bulk.' }
        }

        await prisma.lead.deleteMany({
            where: {
                id: { in: leadIds }
            }
        })
        revalidatePath('/dashboard')
        revalidatePath('/leads')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, error: 'Failed to delete leads' }
    }
}

// Notes Actions

export async function getLeadNotesAction(leadId: string) {
    const notes = await prisma.leadNote.findMany({
        where: { leadId },
        include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        orderBy: { createdAt: 'asc' }
    })

    // Map to match component expectation if needed, or update component
    // Component expects: id, user_id, content, created_at, user: { id, full_name, email, avatar_url }
    return notes.map(n => ({
        id: n.id,
        user_id: n.userId,
        content: n.content,
        created_at: n.createdAt.toISOString(),
        user: {
            id: n.user.id,
            full_name: n.user.name,
            email: n.user.email,
            avatar_url: n.user.avatarUrl
        }
    }))
}

export async function createLeadNoteAction(leadId: string, content: string) {
    const session = await auth()
    if (!session?.user?.email) return { error: "Unauthorized" }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return { error: "User not found" }

    try {
        await prisma.leadNote.create({
            data: {
                leadId,
                userId: user.id,
                content
            }
        })
        return { success: true }
    } catch (error) {
        return { error: "Failed to create note" }
    }
}

export async function deleteLeadNoteAction(noteId: string) {
    const session = await auth()
    if (!session?.user?.email) return { error: "Unauthorized" }

    // Optional: Check if user owns the note

    try {
        await prisma.leadNote.delete({ where: { id: noteId } })
        return { success: true }
    } catch (error) {
        return { error: "Failed to delete note" }
    }
}

export async function getLeadAction(id: string) {
    const session = await auth()
    if (!session?.user?.email) return { error: "Unauthorized" }

    const lead = await prisma.lead.findUnique({
        where: { id }
    })

    if (!lead) return { error: "Lead not found" }

    return {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        country: lead.country,
        city: lead.city,
        profession: lead.profession,
        course_name: lead.courseName,
        time_in_session: lead.timeInSession,
        days_attended: lead.daysAttended,
        bootcamp_attendee: lead.bootcampAttendee,
        status: lead.status,
        source: lead.source,
        utm_source: lead.utmSource,
        utm_campaign: lead.utmCampaign,
        utm_medium: lead.utmMedium,
        utm_content: lead.utmContent,
        utm_term: lead.utmTerm,
        notes: lead.notes,
        assigned_to: lead.assignedToId,
        created_at: lead.createdAt.toISOString(),
        updated_at: lead.updatedAt.toISOString(),
    }
}

export async function updateLeadAction(id: string, data: any) {
    const session = await auth()
    if (!session?.user?.email) return { error: "Unauthorized" }

    try {
        const lead = await prisma.lead.update({
            where: { id },
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                company: data.company,
                country: data.country,
                city: data.city,
                profession: data.profession,
                status: data.status,
                source: data.source,
                notes: data.notes,
                assignedToId: data.assigned_to
            }
        })
        revalidatePath('/leads')
        return { success: true }
    } catch (error: any) {
        return { error: "Failed to update lead: " + error.message }
    }
}

export async function deleteLeadAction(id: string) {
    const session = await auth()
    if (!session?.user?.email) return { error: "Unauthorized" }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true }
        })

        if (!user) return { error: "User not found" }

        if (user.role !== 'admin') {
            // If not admin, check if owner
            const lead = await prisma.lead.findUnique({
                where: { id },
                select: { assignedToId: true, createdById: true }
            })

            if (!lead) return { error: "Lead not found" }

            const isOwner = lead.assignedToId === user.id || lead.createdById === user.id
            if (!isOwner) {
                return { error: "Permission denied. You can only delete your own leads." }
            }
        }

        await prisma.lead.delete({ where: { id } })
        revalidatePath('/leads')
        await logActivityAction('Lead Deleted', 'lead', id)
        return { success: true }
    } catch (error) {
        return { error: "Failed to delete lead" }
    }
}

export async function getProfilesAction() {
    const profiles = await prisma.user.findMany({
        select: { id: true, name: true, email: true }
    })
    return profiles.map(p => ({ id: p.id, full_name: p.name, email: p.email }))
}
