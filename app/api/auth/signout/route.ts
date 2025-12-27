import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut({ scope: "local" })

    if (error) {
      console.error("Sign out error:", error)
      // Even if there's an error, we still want to clear the session on client
      // Return success to allow client-side cleanup
    }

    // Return success with cache control headers to prevent caching
    return NextResponse.json(
      { success: true },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    )
  } catch (error) {
    console.error("Sign out exception:", error)
    // Return success anyway to allow client to redirect
    return NextResponse.json({ success: true })
  }
}
