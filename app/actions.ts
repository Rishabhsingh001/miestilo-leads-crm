
"use server"

import { auth } from "@/auth"
import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

export async function logActivityAction(action: string, entityType: string, entityId?: string, details?: any) {
    const session = await auth()
    if (!session?.user?.email) return

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
    })

    if (!user) return

    await prisma.activityLog.create({
        data: {
            userId: user.id,
            action,
            entityType,
            entityId,
            details: JSON.stringify(details || {})
        }
    })
}

// Leads Actions

export async function createLeadAction(data: any) {
    const session = await auth()
    if (!session?.user?.email) return { error: "Unauthorized" }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return { error: "User not found" }

    try {
        const lead = await prisma.lead.create({
            data: {
                ...data,
                createdById: user.id,
                status: data.status || 'new',
                assignedToId: data.assigned_to,
            }
        })

        await logActivityAction('Lead Created', 'lead', lead.id, { name: lead.name })
        revalidatePath('/leads')
        return { success: true, lead }
    } catch (error) {
        console.error(error)
        return { error: "Failed to create lead" }
    }
}

export async function updateLeadAction(id: string, data: any) {
    const session = await auth()
    if (!session?.user?.email) return { error: "Unauthorized" }

    try {
        await prisma.lead.update({
            where: { id },
            data: {
                ...data,
                assignedToId: data.assigned_to,
            }
        })

        await logActivityAction('Lead Updated', 'lead', id)
        revalidatePath('/leads')
        return { success: true }
    } catch (error) {
        return { error: "Failed to update lead" }
    }
}

export async function deleteLeadAction(id: string) {
    await prisma.lead.delete({ where: { id } })
    revalidatePath('/leads')
    return { success: true }
}

export async function deleteAllLeadsAction() {
    try {
        const session = await auth()
        if (!session?.user?.email) return { success: false, error: "Unauthorized" }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { role: true }
        })

        if (!user || user.role !== 'admin') {
            return { success: false, error: "Permission denied" }
        }

        await prisma.lead.deleteMany()
        revalidatePath('/leads')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, error: "Failed to delete leads" }
    }
}

export async function importLeadsAction(leads: any[]) {
    const session = await auth()
    if (!session?.user?.email) return { error: "Unauthorized" }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return { error: "User not found" }

    console.log("Importing leads:", leads.length)
    if (leads.length === 0) return { error: "No data to import" }

    // Deduplication logic
    const emails = leads.map(l => l.email).filter(Boolean)
    const phones = leads.map(l => l.phone).filter(Boolean)

    const existingEmails = new Set(
        (await prisma.lead.findMany({
            where: { email: { in: emails } },
            select: { email: true }
        })).map(l => l.email)
    )

    const existingPhones = new Set(
        (await prisma.lead.findMany({
            where: { phone: { in: phones } },
            select: { phone: true }
        })).map(l => l.phone)
    )

    let duplicateEmailCount = 0
    let duplicatePhoneCount = 0

    const finalLeads = leads.filter(l => {
        const isEmailDup = l.email && existingEmails.has(l.email)
        const isPhoneDup = !isEmailDup && l.phone && existingPhones.has(l.phone)

        if (isEmailDup) duplicateEmailCount++
        else if (isPhoneDup) duplicatePhoneCount++

        return !isEmailDup && !isPhoneDup
    }).map(l => ({
        ...l,
        createdById: user.id,
        assignedToId: user.id, // default to self assignment
        // Remove helper fields that aren't in prisma model if needed, but 'assigned_to' in `l` is mapped below
        // Actually the `leads` inputs might have snake_case from csv parsing logic in client
        // I should stick to `l` being close to Schema but input is often loose
    }))

    // batch insert
    let importedCount = 0
    // Prisma createMany is supported for SQLite
    try {
        // Need to make sure fields match exactly. 
        // Component sends object with snake_case keys: name, email, phone, company, country, city, profession, notes, source, status, bootcamp_attendee, days_attended
        // Prisma model: name, email, phone, company, country, city, profession, notes, source, status, bootcampAttendee, daysAttended... 

        // Map keys
        const formattedLeads = finalLeads.map(l => ({
            name: l.name,
            email: l.email || null,
            phone: l.phone || null,
            company: l.company || null,
            country: l.country || null,
            city: l.city || null,
            profession: l.profession || null,
            notes: l.notes || null,
            source: l.source || null,
            status: l.status || 'new',
            bootcampAttendee: l.bootcamp_attendee,
            daysAttended: l.days_attended,
            createdById: user.id,
            assignedToId: user.id
        }))

        await prisma.lead.createMany({
            data: formattedLeads
        })
        importedCount = formattedLeads.length
    } catch (e: any) {
        console.error("Import CreateMany Error:", e)
        return { error: "Import failed: " + e.message }
    }

    revalidatePath('/leads')
    return {
        success: true,
        importedCount,
        duplicateEmailCount,
        duplicatePhoneCount
    }
}

// Task Actions (basic)
export async function toggleTaskStatusAction(taskId: string, newStatus: string) {
    await prisma.task.update({
        where: { id: taskId },
        data: { status: newStatus }
    })
    revalidatePath('/tasks')
}
