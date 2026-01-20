
"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

export async function bulkUpdateStatus(leadIds: string[], status: string) {
    try {
        await prisma.lead.updateMany({
            where: {
                id: { in: leadIds }
            },
            data: { status }
        })
        revalidatePath('/dashboard') // Or specific path
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
        await prisma.lead.deleteMany({
            where: {
                id: { in: leadIds }
            }
        })
        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, error: 'Failed to delete leads' }
    }
}
