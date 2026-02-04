
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Cleaning up database...')
    await prisma.activityLog.deleteMany()
    await prisma.leadNote.deleteMany()
    await prisma.task.deleteMany()
    await prisma.lead.deleteMany()
    await prisma.user.deleteMany()

    console.log('Creating test admin user...')
    // Create new ID/Pass
    const password = 'Admin@12345'
    const hashedPassword = await bcrypt.hash(password, 10)

    const admin = await prisma.user.create({
        data: {
            email: 'admin@mikromedia.com',
            name: 'Mikromedia Admin',
            password: hashedPassword,
            role: 'admin',
            status: 'active',
        },
    })

    console.log({ admin })
    console.log('Seeding finished.')
    console.log('-------------------------------------------')
    console.log('NEW CREDENTIALS GENERATED:')
    console.log('Email: admin@mikromedia.com')
    console.log(`Password: ${password}`)
    console.log('-------------------------------------------')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
