import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function DELETE() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile type
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("profile_type")
      .eq("user_id", user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 })
    }

    const profileType = userProfile.profile_type

    // Clear all cache tables based on profile type
    if (profileType === "student") {
      await Promise.all([
        supabase.from("country_recommendations").delete().eq("user_id", user.id),
        supabase.from("scholarships_cache").delete().eq("user_id", user.id),
        supabase.from("timeline_recommendations").delete().eq("user_id", user.id),
        supabase.from("country_details_cache").delete().eq("user_id", user.id),
        supabase.from("university_details_cache").delete().eq("user_id", user.id),
        supabase.from("program_details_cache").delete().eq("user_id", user.id),
        supabase.from("visa_requirements_cache").delete().eq("user_id", user.id),
        supabase.from("accommodation_cache").delete().eq("user_id", user.id),
      ])

      console.log(`[ClearCache] Cleared all student cache tables for user: ${user.id}`)
    } else {
      await Promise.all([
        supabase.from("job_recommendations").delete().eq("user_id", user.id),
        supabase.from("professional_jobs_cache").delete().eq("user_id", user.id),
        supabase.from("professional_visa_cache").delete().eq("user_id", user.id),
        supabase.from("country_details_cache").delete().eq("user_id", user.id),
        supabase.from("accommodation_cache").delete().eq("user_id", user.id),
      ])

      console.log(`[ClearCache] Cleared all professional cache tables for user: ${user.id}`)
    }

    return NextResponse.json({
      success: true,
      message: "All cached recommendations cleared successfully",
      profileType,
    })
  } catch (error) {
    console.error("[ClearCache] Error clearing cache:", error)
    return NextResponse.json({ success: false, error: "Failed to clear cache" }, { status: 500 })
  }
}
