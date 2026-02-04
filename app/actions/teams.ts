"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"


async function getCurrentUser() {
    const session = await auth()
    if (!session?.user?.email) return null

    return await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, teamId: true }
    })
}

async function checkAdmin() {
    const user = await getCurrentUser()
    return user?.role === 'admin'
}

export async function createTeamAction(name: string, managerId: string) {
    if (!(await checkAdmin())) return { error: "Unauthorized" }

    try {
        await prisma.team.create({
            data: {
                name,
                managerId
            }
        })

        // Update manager role to 'manager' if not already
        await prisma.user.update({
            where: { id: managerId },
            data: { role: 'manager' }
        })

        revalidatePath('/teams')
        return { success: true }
    } catch (error: any) {
        return { error: "Failed to create team: " + error.message }
    }
}

export async function deleteTeamAction(id: string) {
    if (!(await checkAdmin())) return { error: "Unauthorized" }

    try {
        await prisma.team.delete({ where: { id } })
        revalidatePath('/teams')
        return { success: true }
    } catch (error) {
        return { error: "Failed to delete team" }
    }
}

export async function addMemberToTeamAction(teamId: string, userId: string) {
    const user = await getCurrentUser()
    if (!user) return { error: "Unauthorized" }

    // Admin can add anyone to any team
    // Manager can only add people to their own team
    if (user.role !== 'admin') {
        const managedTeam = await prisma.team.findFirst({
            where: { id: teamId, managerId: user.id }
        })
        if (!managedTeam) return { error: "Unauthorized" }
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { teamId }
        })
        revalidatePath('/teams')
        return { success: true }
    } catch (error) {
        return { error: "Failed to add member" }
    }
}

export async function removeMemberFromTeamAction(userId: string) {
    const user = await getCurrentUser()
    if (!user) return { error: "Unauthorized" }

    try {
        const memberToRemove = await prisma.user.findUnique({
            where: { id: userId },
            select: { teamId: true }
        })

        if (!memberToRemove) return { error: "User not found" }

        // Admin can remove anyone
        // Manager can only remove from their team
        if (user.role !== 'admin') {
            const managedTeam = await prisma.team.findFirst({
                where: { id: memberToRemove.teamId || '', managerId: user.id }
            })
            if (!managedTeam) return { error: "Unauthorized" }
        }

        await prisma.user.update({
            where: { id: userId },
            data: { teamId: null }
        })
        revalidatePath('/teams')
        return { success: true }
    } catch (error) {
        return { error: "Failed to remove member" }
    }
}
