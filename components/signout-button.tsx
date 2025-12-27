"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function SignOutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut({ scope: "local" })

      // Also call API to clear server-side session
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
      })

      // Redirect to login page
      router.push("/auth/login")
      router.refresh()
    } catch (error) {
      console.error("Sign out error:", error)
      // Even on error, redirect to login
      router.push("/auth/login")
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleSignOut}
      disabled={isLoading}
      className="flex items-center gap-2 bg-transparent"
    >
      <LogOut className="w-4 h-4" />
      {isLoading ? "Signing out..." : "Sign Out"}
    </Button>
  )
}
