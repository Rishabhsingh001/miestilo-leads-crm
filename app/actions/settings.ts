
"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

const prisma = new PrismaClient()

export async function getProfileSettingsAction() {
    const session = await auth()
    if (!session?.user?.email) return { error: "Unauthorized" }

    const profile = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, name: true, email: true, role: true, avatarUrl: true }
    })

    if (!profile) return { error: "Profile not found" }

    return {
        id: profile.id,
        full_name: profile.name,
        email: profile.email,
        role: profile.role,
        avatar_url: profile.avatarUrl
    }
}

export async function updateProfileSettingsAction(data: { full_name: string }) {
    const session = await auth()
    if (!session?.user?.email) return { error: "Unauthorized" }

    try {
        await prisma.user.update({
            where: { email: session.user.email },
            data: { name: data.full_name }
        })
        revalidatePath('/settings')
        return { success: true }
    } catch (error) {
        return { error: "Failed to update profile" }
    }
}

export async function uploadAvatarAction(formData: FormData) {
    const session = await auth()
    if (!session?.user?.email) return { error: "Unauthorized" }

    const file = formData.get("file") as File
    if (!file) return { error: "No file provided" }

    try {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Ensure directory exists
        const uploadDir = join(process.cwd(), "public", "uploads", "avatars")
        await mkdir(uploadDir, { recursive: true })

        // Unique filename
        const filename = `${session.user.id}-${Date.now()}-${file.name}`
        const filepath = join(uploadDir, filename)

        await writeFile(filepath, buffer)

        const publicUrl = `/uploads/avatars/${filename}`

        await prisma.user.update({
            where: { email: session.user.email },
            data: { avatarUrl: publicUrl }
        })

        revalidatePath('/settings')
        return { success: true, url: publicUrl }
    } catch (error) {
        console.error("Upload error:", error)
        return { error: "Failed to upload avatar" }
    }
}
