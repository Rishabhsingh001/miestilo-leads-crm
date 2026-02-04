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
import { Loader2, Eye, EyeOff, Globe, Smartphone, BarChart3, PieChart, Activity } from "lucide-react"

const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema)
    })

    async function onSubmit(data: z.infer<typeof schema>) {
        setLoading(true)

        try {
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
        <div className="flex min-h-screen w-full flex-col lg:flex-row bg-slate-50/50">
            {/* Left Panel - Dashboard Theme matches Sidebar (White/Slate with Primary accents) */}
            <div className="relative flex w-full flex-col items-center justify-center bg-slate-900 p-10 text-white lg:w-[45%] lg:p-20 overflow-hidden">
                {/* Subtle Grid Pattern for Technical Feel */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>

                <div className="z-10 mb-12 text-center">
                    <p className="mb-4 text-sm text-slate-300">Unified Sales & Lead Management System</p>
                    <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white">
                        Mikromedia<br /><span className="text-slate-400">Workspace</span>
                    </h1>
                </div>

                {/* Simplified Minimalist Interface Representation */}
                <div className="relative z-10 w-[280px]">
                    <div className="relative rounded-[2rem] border-[6px] border-slate-700 bg-slate-800 shadow-2xl">
                        <div className="absolute left-1/2 top-0 h-5 w-24 -translate-x-1/2 rounded-b-lg bg-slate-700"></div>
                        <div className="h-[500px] overflow-hidden rounded-[1.5rem] bg-white p-5 text-slate-900">
                            {/* Mock CRM Dashboard UI */}
                            <div className="flex items-center justify-between mb-6 pt-6">
                                <div className="h-2 w-16 bg-slate-200 rounded"></div>
                                <div className="h-6 w-6 rounded-full bg-slate-100"></div>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-xs text-slate-400 mb-1">New Leads</div>
                                    <div className="text-lg font-bold text-slate-900">128</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-xs text-slate-400 mb-1">Conversion</div>
                                    <div className="text-lg font-bold text-emerald-600">2.4%</div>
                                </div>
                            </div>

                            {/* List Items */}
                            <div className="space-y-3">
                                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent Activity</div>
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                            <div className="h-4 w-4 bg-slate-300 rounded-full"></div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="h-2 w-20 bg-slate-200 rounded mb-1.5"></div>
                                            <div className="h-1.5 w-12 bg-slate-100 rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 p-4 bg-slate-900 rounded-xl text-white">
                                <div className="flex items-center gap-2 mb-2">
                                    <Activity className="h-4 w-4 text-emerald-400" />
                                    <span className="text-xs font-medium">Performance</span>
                                </div>
                                <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full w-[70%] bg-emerald-500"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Shadow/Glow */}
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-40 h-20 bg-emerald-500/20 blur-[50px]"></div>
                </div>
            </div>

            {/* Right Panel - Login Form (Clean Slate Theme) */}
            <div className="flex w-full flex-col justify-between bg-white p-8 lg:w-[55%] lg:p-24">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl text-slate-900">
                        <div className="h-8 w-8 bg-slate-900 text-white flex items-center justify-center rounded-lg">M</div>
                        <span>Mikromedia</span>
                    </div>
                </div>

                <div className="mx-auto w-full max-w-sm mt-12 lg:mt-0">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h2>
                        <p className="mt-2 text-sm text-slate-500">Please enter your details to sign in.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                            <Input
                                id="email"
                                placeholder="name@company.com"
                                className="h-11 rounded-lg border-slate-200 bg-slate-50 px-4 text-sm shadow-sm transition-colors focus:border-slate-900 focus:bg-white focus:ring-slate-900"
                                disabled={loading}
                                {...register("email")}
                            />
                            {errors.email && (
                                <p className="text-xs text-red-500">{errors.email.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                                <a href="/forgot-password" className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline">
                                    Forgot password?
                                </a>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="h-11 rounded-lg border-slate-200 bg-slate-50 px-4 pr-10 text-sm shadow-sm transition-colors focus:border-slate-900 focus:bg-white focus:ring-slate-900"
                                    disabled={loading}
                                    {...register("password")}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-400 hover:text-slate-600"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            {errors.password && (
                                <p className="text-xs text-red-500">{errors.password.message}</p>
                            )}
                        </div>

                        <Button
                            className="h-11 w-full rounded-lg bg-slate-900 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 mt-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : "Sign In"}
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-500">
                        Don't have an account?{" "}
                        <a href="/register" className="font-semibold text-slate-900 hover:underline">
                            Request access
                        </a>
                    </p>
                </div>

                <div className="flex items-center justify-center text-xs text-slate-400 mt-12 lg:mt-0">
                    <p>© Mikromedia Inc. All rights reserved.</p>
                </div>
            </div>
        </div>
    )
}
