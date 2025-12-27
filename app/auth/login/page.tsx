"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Globe, Eye, EyeOff } from "lucide-react"
import { message } from "antd"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)

    try {
      const emailNormalized = email.trim().toLowerCase()
      const passwordNormalized = password.trim()

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailNormalized,
        password: passwordNormalized,
      })

      if (signInError) {
        const errorMessage = signInError.message.toLowerCase()

        if (errorMessage.includes("invalid login credentials") || errorMessage.includes("invalid_credentials")) {
          messageApi.error("Incorrect email or password. Please check your credentials and try again.")
        } else if (errorMessage.includes("email not confirmed")) {
          if (data?.user) {
            router.push("/dashboard")
            return
          }
          messageApi.warning("Please verify your email address to continue.")
        } else if (errorMessage.includes("too many requests") || errorMessage.includes("rate")) {
          messageApi.warning("Too many login attempts. Please wait a moment and try again.")
        } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
          messageApi.error("Network error. Please check your connection and try again.")
        } else {
          messageApi.error(signInError.message)
        }
        setIsLoading(false)
        return
      }

      if (data?.user) {
        messageApi.success("Login successful! Redirecting...")
        const { data: userProfile } = await supabase
          .from("user_profiles")
          .select("onboarding_completed, profile_type")
          .eq("user_id", data.user.id)
          .maybeSingle()

        if (userProfile?.onboarding_completed) {
          router.push("/dashboard")
        } else {
          router.push("/onboarding")
        }
      } else {
        messageApi.error("Login failed. Please try again.")
      }
    } catch (error: unknown) {
      messageApi.error(error instanceof Error ? error.message : "An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#e2e8f0] flex flex-col">
      {contextHolder}
      {/* Header */}
      <header className="bg-[#e2e8f0] border-b border-[#cbd5e1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#1d293d] flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
            </Link>

            <nav className="hidden sm:flex items-center gap-8">
              <Link href="/" className="text-sm text-[#1d293d] hover:text-[#0f172a] transition-colors font-medium">
                Home
              </Link>
              <Link href="/about" className="text-sm text-[#1d293d] hover:text-[#0f172a] transition-colors font-medium">
                About
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-[#1d293d] hover:text-[#0f172a] transition-colors font-medium"
              >
                Privacy
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/auth/sign-up"
                className="border border-[#1d293d] text-[#1d293d] hover:bg-[#1d293d] hover:text-white bg-transparent rounded-full px-6 py-2 text-sm font-medium transition-colors"
              >
                Sign up
              </Link>
              <Link
                href="/auth/login"
                className="bg-[#1d293d] text-white hover:bg-[#0f172a] rounded-full px-6 py-2 text-sm font-medium transition-colors"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Centered Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            {/* Logo at top */}
           

            <h1 className="text-2xl font-bold text-[#1d293d] text-center mb-1">Sign In</h1>
            <p className="text-[#64748b] text-center text-sm mb-8">Welcome back! Please enter your details</p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#475569] mb-2">Email</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border border-[#e2e8f0] h-12 text-[#1d293d] placeholder:text-[#94a3b8] rounded-xl focus:ring-2 focus:ring-[#1d293d] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#475569] mb-2">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white border border-[#e2e8f0] h-12 pr-10 text-[#1d293d] placeholder:text-[#94a3b8] rounded-xl focus:ring-2 focus:ring-[#1d293d] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#1d293d] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                 
                </div>
                <Link href="/auth/forgot-password" className="text-sm text-[#1d293d] hover:underline font-medium">
                  Forgot password
                </Link>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-[#1d293d] text-white hover:bg-[#0f172a] rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-[#64748b]">
                Don't have an account?{" "}
                <Link href="/auth/sign-up" className="text-[#1d293d] font-semibold hover:underline">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
