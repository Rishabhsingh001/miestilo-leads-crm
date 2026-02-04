
"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { hash } from "bcryptjs"
import { auth } from "@/auth"

const prisma = new PrismaClient()

async function checkAdmin() {
    const session = await auth()
    if (!session?.user?.email) return false

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true }
    })

    return user?.role === 'admin'
}

export async function createTeamMemberAction(data: any) {
    if (!(await checkAdmin())) return { error: "Unauthorized: Admins only" }

    // Check if email exists
    const existing = await prisma.user.findUnique({
        where: { email: data.email }
    })

    if (existing) {
        return { error: "A user with this email already exists." }
    }

    const hashedPassword = await hash(data.password, 10)

    try {
        await prisma.user.create({
            data: {
                name: data.fullName,
                email: data.email,
                password: hashedPassword,
                role: data.role,
                status: 'active',
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`
            }
        })
        revalidatePath('/users')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: "Failed to create user" }
    }
}

export async function updateTeamMemberAction(id: string, data: any) {
    if (!(await checkAdmin())) return { error: "Unauthorized: Admins only" }

    try {
        const updateData: any = {
            role: data.role,
            status: data.status
        }

        if (data.password) {
            updateData.password = await hash(data.password, 10)
        }

        await prisma.user.update({
            where: { id },
            data: updateData
        })
        revalidatePath('/users')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: "Failed to update user" }
    }
}

export async function deleteTeamMemberAction(id: string) {
    if (!(await checkAdmin())) return { error: "Unauthorized: Admins only" }

    try {
        await prisma.user.delete({ where: { id } })
        revalidatePath('/users')
        return { success: true }
    } catch (error) {
        return { error: "Failed to delete user" }
    }
}
