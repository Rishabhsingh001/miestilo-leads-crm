"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema)
    })

    async function onSubmit(data: z.infer<typeof schema>) {
        setLoading(true)

        try {
            // Import dynamically to ensure client-side compatibility if needed, or stick to standard import at top
            const { signIn } = await import("next-auth/react")

            const result = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            })

            if (result?.error) {
                toast.error("Invalid credentials")
                setLoading(false)
                return
            }

            // await logActivity('Login', 'auth') // Re-enable later when logger is fixed
            toast.success("Logged in successfully")
            router.replace("/dashboard")
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error("Something went wrong")
            setLoading(false)
        }
    }

    return (
        <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
                <div className="absolute inset-0 bg-zinc-900" />
                {/* Modern Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-500 to-purple-800 opacity-90" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

                <div className="relative z-20 flex items-center text-lg font-medium">
                    {/* <Command className="mr-2 h-6 w-6" /> */}
                    <img src="/logo-white.png" alt="Mikromedia" className="mr-2 h-10 w-auto" />
                </div>
                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-lg">
                            &ldquo;This CRM has completely transformed how we manage our client relationships. The design is stunning and the features are exactly what we needed to scale.&rdquo;
                        </p>
                        <footer className="text-sm">Rishabh singh, Head of Marketing</footer>
                    </blockquote>
                </div>
            </div>
            <div className="lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Welcome back
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your credentials to access your account
                        </p>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    placeholder="name@example.com"
                                    type="email"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    autoCorrect="off"
                                    disabled={loading}
                                    {...register("email")}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500">{errors.email.message}</p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    placeholder="••••••••"
                                    type="password"
                                    autoComplete="current-password"
                                    disabled={loading}
                                    {...register("password")}
                                />
                                {errors.password && (
                                    <p className="text-sm text-red-500">{errors.password.message}</p>
                                )}
                            </div>
                            <Button disabled={loading}>
                                {loading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Sign In
                            </Button>
                        </div>
                    </form>
                    <p className="px-8 text-center text-sm text-muted-foreground">
                        By clicking continue, you agree to our{" "}
                        <a href="/terms" className="underline underline-offset-4 hover:text-primary">
                            Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
                            Privacy Policy
                        </a>
                        .
                    </p>
                </div>
            </div>
        </div>
    )
}
