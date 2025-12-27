"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/aceternity-sidebar"
import { Home, DollarSign, History, GraduationCap, LogOut, MessageCircle, UserCircle } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

const studentLinks = [
  {
    label: "Home",
    href: "/dashboard",
    icon: <Home className="text-white h-5 w-5 shrink-0" />,
  },
  {
    label: "Scholarships",
    href: "/dashboard/scholarships",
    icon: <GraduationCap className="text-white h-5 w-5 shrink-0" />,
  },
  {
    label: "Chat",
    href: "/dashboard/chat",
    icon: <MessageCircle className="text-white h-5 w-5 shrink-0" />,
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: <UserCircle className="text-white h-5 w-5 shrink-0" />,
  },
]

const professionalLinks = [
  {
    label: "Home",
    href: "/dashboard",
    icon: <Home className="text-white h-5 w-5 shrink-0" />,
  },

  {
    label: "Chat",
    href: "/dashboard/chat",
    icon: <MessageCircle className="text-white h-5 w-5 shrink-0" />,
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: <UserCircle className="text-white h-5 w-5 shrink-0" />,
  },
]

export function DashboardSidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const [profileType, setProfileType] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("User")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    async function fetchUserProfile() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: userProfile } = await supabase
          .from("user_profiles")
          .select("profile_type, full_name, avatar_url")
          .eq("user_id", user.id)
          .single()

        if (userProfile) {
          setProfileType(userProfile.profile_type)
          setUserName(userProfile.full_name || "User")
          setAvatarUrl(userProfile.avatar_url)
        }
      }
    }

    fetchUserProfile()
  }, [])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("[v0] Error signing out:", error)
      setIsSigningOut(false)
    }
  }

  const links = profileType === "professional" ? professionalLinks : studentLinks

  return (
    <div className="flex flex-col md:flex-row bg-slate-200 w-full min-h-screen md:h-screen md:overflow-hidden">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
            <Logo open={open} />
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link) => (
                <SidebarLink
                  key={link.href}
                  link={link}
                  className={cn("rounded-lg px-2 transition-colors", pathname === link.href && "bg-slate-700")}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <SidebarLink
              link={{
                label: userName,
                href: "/dashboard/profile",
                icon: (
                  <Image
                    src={avatarUrl || "/placeholder.svg?height=40&width=40&query=user avatar"}
                    className="h-7 w-7 shrink-0 rounded-full object-cover"
                    width={40}
                    height={40}
                    alt="Avatar"
                  />
                ),
              }}
            />
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className={cn(
                "flex items-center gap-2 px-2 py-2 rounded-lg text-white/80 hover:text-white hover:bg-red-600/20 transition-colors text-sm",
                isSigningOut && "opacity-50 cursor-not-allowed",
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <motion.span
                animate={{
                  display: open ? "inline-block" : "none",
                  opacity: open ? 1 : 0,
                }}
                className="whitespace-pre"
              >
                {isSigningOut ? "Signing out..." : "Sign Out"}
              </motion.span>
            </button>
          </div>
        </SidebarBody>
      </Sidebar>
      <main className="flex-1 overflow-y-auto scrollbar-hide relative">{children}</main>
    </div>
  )
}

const Logo = ({ open }: { open: boolean }) => {
  return (
    <Link href="/dashboard" className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20">
      <div className="h-5 w-6 bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm shrink-0" />
      <motion.span
        animate={{
          display: open ? "inline-block" : "none",
          opacity: open ? 1 : 0,
        }}
        className="font-medium text-white whitespace-pre"
      >
        StudyAbroad
      </motion.span>
    </Link>
  )
}
