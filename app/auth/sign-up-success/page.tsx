import Link from "next/link"
import { Globe, Mail, CheckCircle } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-[#e2e8f0] flex flex-col">
      {/* Header - matching sign-up page style */}
      <header className="bg-[#e2e8f0] border-b border-[#cbd5e1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#1d293d] flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
            </Link>
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

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#1d293d] mb-2">Check Your Email</h1>
            <p className="text-[#64748b] text-sm mb-6">We've sent a confirmation link to your email address</p>

            <div className="flex items-start gap-3 text-left bg-[#f1f5f9] p-4 rounded-xl mb-6">
              <Mail className="w-5 h-5 text-[#1d293d] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-[#475569]">
                  Click the link in your email to verify your account. Once verified, you'll be automatically logged in
                  and can start your onboarding.
                </p>
              </div>
            </div>

            <p className="text-xs text-[#94a3b8] mb-6">
              Didn't receive the email? Check your spam folder or wait a few minutes.
            </p>

            <Link
              href="/auth/login"
              className="inline-block w-full h-12 bg-[#1d293d] text-white hover:bg-[#0f172a] rounded-xl font-semibold transition-all leading-[3rem] text-center"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
