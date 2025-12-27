"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Globe, Eye, EyeOff, Mail, CheckCircle } from "lucide-react"
import { message } from "antd"

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [profileType, setProfileType] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showRepeatPassword, setShowRepeatPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)

    if (password !== repeatPassword) {
      messageApi.error("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      messageApi.error("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    if (!profileType) {
      messageApi.warning("Please select a profile type")
      setIsLoading(false)
      return
    }

    try {
      const emailNormalized = email.trim().toLowerCase()
      const passwordNormalized = password.trim()

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: emailNormalized,
        password: passwordNormalized,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/onboarding`,
          data: {
            full_name: name,
            profile_type: profileType,
          },
        },
      })

      if (signUpError) {
        if (signUpError.message.includes("User already registered")) {
          messageApi.error("An account with this email already exists. Please sign in instead.")
        } else if (signUpError.message.includes("Password")) {
          messageApi.error("Password must be at least 6 characters long.")
        } else if (signUpError.message.includes("rate") || signUpError.message.includes("limit")) {
          messageApi.warning("Too many attempts. Please wait a moment and try again.")
        } else {
          messageApi.error(signUpError.message)
        }
        setIsLoading(false)
        return
      }

      if (data?.user) {
        const upsertProfile = async () => {
          const { error: profileError } = await supabase.from("user_profiles").upsert(
            {
              user_id: data.user!.id,
              full_name: name,
              email: email,
              profile_type: profileType,
              onboarding_completed: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          )

          if (profileError) {
            console.error("Error creating user profile:", profileError)
            messageApi.error("Failed to create user profile. Please try again or contact support.")
            return false
          }

          return true
        }

        if (data.session) {
          const ok = await upsertProfile()
          if (ok) {
            messageApi.success("Account created successfully!")
            router.push("/onboarding")
          }
          return
        }

        // Show email confirmation modal
        setShowEmailModal(true)
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

      {/* Email Confirmation Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-[#e2e8f0] flex items-center justify-center">
                <Mail className="w-10 h-10 text-[#1d293d]" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h2 className="text-xl font-bold text-[#1d293d]">Check Your Email</h2>
            </div>

            <p className="text-[#64748b] text-center mb-2">We've sent a confirmation link to</p>
            <p className="text-[#1d293d] font-semibold text-center mb-6">{email}</p>

            <p className="text-[#94a3b8] text-sm text-center mb-8">
              Please click the link in your email to verify your account and continue with the onboarding process.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => router.push("/auth/login")}
                className="w-full h-12 bg-[#1d293d] text-white hover:bg-[#0f172a] rounded-xl font-semibold transition-all"
              >
                Go to Sign In
              </button>
              <button
                onClick={() => setShowEmailModal(false)}
                className="w-full h-12 border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc] rounded-xl font-medium transition-all"
              >
                Close
              </button>
            </div>

            <p className="text-[#94a3b8] text-xs text-center mt-6">
              Didn't receive the email? Check your spam folder or{" "}
              <button onClick={handleSignUp} className="text-[#1d293d] font-medium hover:underline">
                resend
              </button>
            </p>
          </div>
        </div>
      )}

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
            

            <h1 className="text-2xl font-bold text-[#1d293d] text-center mb-1">Create Account</h1>
            <p className="text-[#64748b] text-center text-sm mb-8">Let's get started with your journey</p>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#475569] mb-2">Full Name</label>
                <Input
                  type="text"
                  placeholder="Enter your name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white border border-[#e2e8f0] h-12 text-[#1d293d] placeholder:text-[#94a3b8] rounded-xl focus:ring-2 focus:ring-[#1d293d] focus:border-transparent"
                />
              </div>

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
                    placeholder="Enter your password"
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

              <div>
                <label className="block text-sm font-medium text-[#475569] mb-2">Confirm Password</label>
                <div className="relative">
                  <Input
                    type={showRepeatPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    className="bg-white border border-[#e2e8f0] h-12 pr-10 text-[#1d293d] placeholder:text-[#94a3b8] rounded-xl focus:ring-2 focus:ring-[#1d293d] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#1d293d] transition-colors"
                  >
                    {showRepeatPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#475569] mb-2">I am a</label>
                <Select value={profileType} onValueChange={setProfileType}>
                  <SelectTrigger className="bg-white border border-[#e2e8f0] h-12 text-[#1d293d] rounded-xl focus:ring-2 focus:ring-[#1d293d]">
                    <SelectValue placeholder="Select your profile type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-[#1d293d] text-white hover:bg-[#0f172a] rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-[#64748b]">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-[#1d293d] font-semibold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
