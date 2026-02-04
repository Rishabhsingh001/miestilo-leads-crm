
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@mikromedia.com'
    const user = await prisma.user.findUnique({ where: { email } })

    if (user) {
        console.log(`User found: ${user.email}`)
        console.log(`Role: ${user.role}`)
        console.log(`Password Hash starts with: ${user.password.substring(0, 10)}...`)

        // Test password comparison locally
        const isMatch = await bcrypt.compare('password123', user.password)
        console.log(`Password 'password123' works locally? ${isMatch}`)
    } else {
        console.log('User NOT found!')
    }
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
