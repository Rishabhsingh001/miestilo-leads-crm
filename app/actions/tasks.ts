
"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

const prisma = new PrismaClient()

export async function getTaskAction(id: string) {
    const session = await auth()
    if (!session?.user?.email) return { error: "Unauthorized" }

    const task = await prisma.task.findUnique({
        where: { id }
    })

    if (!task) return { error: "Task not found" }

    // Transform if necessary to match client expectations (snake_case vs camelCase)
    // The previous code used Supabase response which is usually snake_case if schema is SQL
    // But Prisma object is camelCase: dueDate, assignedToId...
    // The client component currently uses: title, description, priority, status, due_date (snake_case in state)

    return {
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        due_date: task.dueDate ? task.dueDate.toISOString() : null, // Mapped to match previous usage
        assigned_to: task.assignedToId,
        lead_id: task.leadId
    }
}

export async function getTaskFormDataAction() {
    const session = await auth()
    if (!session?.user?.email) return { profiles: [], leads: [] }

    const profiles = await prisma.user.findMany({
        select: { id: true, name: true, email: true }
    })

    const leads = await prisma.lead.findMany({
        select: { id: true, name: true, company: true },
        orderBy: { createdAt: 'desc' },
        take: 50
    })

    return {
        profiles: profiles.map(p => ({ id: p.id, full_name: p.name, email: p.email })),
        leads
    }
}

export async function createTaskAction(data: any) {
    const session = await auth()
    if (!session?.user?.email) return { error: "Unauthorized" }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return { error: "User not found" }

    try {
        const task = await prisma.task.create({
            data: {
                title: data.title,
                description: data.description,
                priority: data.priority,
                status: data.status,
                dueDate: data.due_date,
                assignedToId: data.assigned_to,
                leadId: data.lead_id,
                createdById: user.id
            }
        })

        revalidatePath('/tasks')
        revalidatePath('/dashboard')
        return { success: true, task }
    } catch (error) {
        console.error(error)
        return { error: "Failed to create task" }
    }
}

export async function updateTaskAction(id: string, data: any) {
    const session = await auth()
    if (!session?.user?.email) return { error: "Unauthorized" }

    try {
        const task = await prisma.task.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                priority: data.priority,
                status: data.status,
                dueDate: data.due_date,
                assignedToId: data.assigned_to,
                leadId: data.lead_id,
            }
        })
        revalidatePath('/tasks')
        revalidatePath('/dashboard')
        return { success: true, task }
    } catch (error) {
        return { error: "Failed to update task" }
    }
}

export async function deleteTaskAction(id: string) {
    const session = await auth()
    if (!session?.user?.email) return { error: "Unauthorized" }

    try {
        await prisma.task.delete({ where: { id } })
        revalidatePath('/tasks')
        return { success: true }
    } catch (error) {
        return { error: "Failed to delete task" }
    }
}

export async function toggleTaskStatusAction(taskId: string, newStatus: string) {
    await prisma.task.update({
        where: { id: taskId },
        data: { status: newStatus }
    })
    revalidatePath('/tasks')
}
