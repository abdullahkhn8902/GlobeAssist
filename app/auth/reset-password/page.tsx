"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Globe, Eye, EyeOff, Lock, CheckCircle } from "lucide-react"
import { message } from "antd"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [messageApi, contextHolder] = message.useMessage()
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        setIsValidSession(true)
      } else {
        // Check for hash fragment (Supabase recovery link)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get("access_token")
        const type = hashParams.get("type")

        if (accessToken && type === "recovery") {
          // Set the session from the recovery link
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get("refresh_token") || "",
          })

          if (!error) {
            setIsValidSession(true)
            // Clear the hash from URL
            window.history.replaceState(null, "", window.location.pathname)
          } else {
            messageApi.error("Invalid or expired reset link")
            setTimeout(() => router.push("/auth/forgot-password"), 2000)
          }
        } else {
          messageApi.error("Invalid reset link. Please request a new one.")
          setTimeout(() => router.push("/auth/forgot-password"), 2000)
        }
      }
      setIsChecking(false)
    }

    checkSession()
  }, [router, messageApi])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)

    if (password !== confirmPassword) {
      messageApi.error("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      messageApi.error("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        messageApi.error(error.message)
        setIsLoading(false)
        return
      }

      messageApi.success("Password updated successfully!")
      setIsSuccess(true)
    } catch (error: unknown) {
      messageApi.error(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state while checking session
  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#e2e8f0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1d293d]/20 border-t-[#1d293d] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#64748b]">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  // Invalid session state
  if (!isValidSession && !isSuccess) {
    return (
      <div className="min-h-screen bg-[#e2e8f0] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#1d293d] mb-2">Invalid Reset Link</h1>
          <p className="text-[#64748b] mb-6">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link
            href="/auth/forgot-password"
            className="block w-full h-12 bg-[#1d293d] text-white hover:bg-[#0f172a] rounded-xl font-semibold transition-all text-center leading-[48px]"
          >
            Request New Link
          </Link>
        </div>
      </div>
    )
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

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            {isSuccess ? (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-[#1d293d] text-center mb-1">Password Updated!</h1>
                <p className="text-[#64748b] text-center text-sm mb-8">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>

                <Link
                  href="/auth/login"
                  className="block w-full h-12 bg-[#1d293d] text-white hover:bg-[#0f172a] rounded-xl font-semibold transition-all text-center leading-[48px]"
                >
                  Sign In
                </Link>
              </>
            ) : (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-[#e2e8f0] flex items-center justify-center">
                    <Lock className="w-8 h-8 text-[#1d293d]" />
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-[#1d293d] text-center mb-1">Create New Password</h1>
                <p className="text-[#64748b] text-center text-sm mb-8">
                  Your new password must be at least 6 characters long.
                </p>

                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-[#475569] mb-2">New Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
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
                    <label className="block text-sm font-medium text-[#475569] mb-2">Confirm New Password</label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-white border border-[#e2e8f0] h-12 pr-10 text-[#1d293d] placeholder:text-[#94a3b8] rounded-xl focus:ring-2 focus:ring-[#1d293d] focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#1d293d] transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Password strength indicator */}
                  {password && (
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        <div
                          className={`h-1 flex-1 rounded-full ${password.length >= 6 ? "bg-green-500" : "bg-[#e2e8f0]"}`}
                        />
                        <div
                          className={`h-1 flex-1 rounded-full ${password.length >= 8 ? "bg-green-500" : "bg-[#e2e8f0]"}`}
                        />
                        <div
                          className={`h-1 flex-1 rounded-full ${/[A-Z]/.test(password) && /[0-9]/.test(password) ? "bg-green-500" : "bg-[#e2e8f0]"}`}
                        />
                      </div>
                      <p className="text-xs text-[#64748b]">
                        {password.length < 6
                          ? "Password too short"
                          : password.length < 8
                            ? "Good password"
                            : "Strong password"}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full h-12 bg-[#1d293d] text-white hover:bg-[#0f172a] rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Updating Password...
                      </span>
                    ) : (
                      "Update Password"
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-[#e2e8f0]">
                  <p className="text-center text-sm text-[#64748b]">
                    Remember your password?{" "}
                    <Link href="/auth/login" className="text-[#1d293d] font-semibold hover:underline">
                      Sign In
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
