"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useState } from "react"
import { Globe, Mail, ArrowLeft, CheckCircle } from "lucide-react"
import { message } from "antd"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)

    try {
      const emailNormalized = email.trim().toLowerCase()

      // Use the same redirect URL pattern as sign-up
      const redirectUrl = `${window.location.origin}/auth/reset-password`

      const { error } = await supabase.auth.resetPasswordForEmail(emailNormalized, {
        redirectTo: redirectUrl,
      })

      if (error) {
        if (error.message.includes("rate") || error.message.includes("limit")) {
          messageApi.warning("Too many attempts. Please wait a moment and try again.")
        } else if (error.message.includes("not found") || error.message.includes("Invalid")) {
          // Don't reveal if email exists or not for security
          setEmailSent(true)
        } else {
          messageApi.error(error.message)
        }
        setIsLoading(false)
        return
      }

      setEmailSent(true)
    } catch (error: unknown) {
      messageApi.error(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendLink = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const redirectUrl = `${window.location.origin}/auth/reset-password`

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: redirectUrl,
      })

      if (error) {
        messageApi.error(error.message)
      } else {
        messageApi.success("New reset link sent to your email!")
      }
    } catch (error: unknown) {
      messageApi.error(error instanceof Error ? error.message : "An error occurred")
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

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Back to Login */}
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-[#64748b] hover:text-[#1d293d] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Login</span>
          </Link>

          <div className="bg-white rounded-3xl p-8 shadow-xl">
            {/* Email Sent Success State */}
            {emailSent ? (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-[#e2e8f0] flex items-center justify-center">
                    <Mail className="w-10 h-10 text-[#1d293d]" />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <h2 className="text-xl font-bold text-[#1d293d]">Check Your Email</h2>
                </div>

                <p className="text-[#64748b] text-center mb-2">We've sent a password reset link to</p>
                <p className="text-[#1d293d] font-semibold text-center mb-6">{email}</p>

                <p className="text-[#94a3b8] text-sm text-center mb-8">
                  Click the link in your email to reset your password. The link will expire in 1 hour.
                </p>

                <div className="space-y-3">
                  <Link
                    href="/auth/login"
                    className="block w-full h-12 bg-[#1d293d] text-white hover:bg-[#0f172a] rounded-xl font-semibold transition-all text-center leading-[48px]"
                  >
                    Go to Sign In
                  </Link>
                  <button
                    onClick={() => {
                      setEmailSent(false)
                      setEmail("")
                    }}
                    className="w-full h-12 border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc] rounded-xl font-medium transition-all"
                  >
                    Try Different Email
                  </button>
                </div>

                <p className="text-[#94a3b8] text-xs text-center mt-6">
                  Didn't receive the email? Check your spam folder or{" "}
                  <button
                    onClick={handleResendLink}
                    disabled={isLoading}
                    className="text-[#1d293d] font-medium hover:underline disabled:opacity-50"
                  >
                    {isLoading ? "Sending..." : "resend"}
                  </button>
                </p>
              </>
            ) : (
              <>
                {/* Email Input Form */}
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-[#e2e8f0] flex items-center justify-center">
                    <Mail className="w-8 h-8 text-[#1d293d]" />
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-[#1d293d] text-center mb-1">Forgot Password?</h1>
                <p className="text-[#64748b] text-center text-sm mb-8">
                  No worries! Enter your email and we'll send you a reset link.
                </p>

                <form onSubmit={handleSendResetLink} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-[#475569] mb-2">Email Address</label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white border border-[#e2e8f0] h-12 text-[#1d293d] placeholder:text-[#94a3b8] rounded-xl focus:ring-2 focus:ring-[#1d293d] focus:border-transparent"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-12 bg-[#1d293d] text-white hover:bg-[#0f172a] rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending Link...
                      </span>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </form>

                {/* Footer */}
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
