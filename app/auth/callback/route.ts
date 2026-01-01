import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/onboarding"

  if (code) {
    const supabase = await createClient()

    // Exchange the code for a session - this confirms the email
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get the user to check their profile
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Check if user has completed onboarding
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("onboarding_completed")
          .eq("user_id", user.id)
          .maybeSingle()

        // Redirect based on onboarding status
        if (profile?.onboarding_completed) {
          return NextResponse.redirect(`${origin}/dashboard`)
        }
        return NextResponse.redirect(`${origin}/onboarding`)
      }
    }
  }

  // Return the user to an error page if something went wrong
  return NextResponse.redirect(`${origin}/auth/error?error=Could not verify email. Please try again.`)
}
