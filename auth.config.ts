
import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                // @ts-ignore
                token.role = user.role
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                // @ts-ignore
                session.user.id = token.id
                // @ts-ignore
                session.user.role = token.role
            }
            return session
        }
    },
    providers: [], // Configured in auth.ts
    session: {
        strategy: "jwt",
    },
} satisfies NextAuthConfig
