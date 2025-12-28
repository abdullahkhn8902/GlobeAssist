"use client"

import { cn } from "@/lib/utils"
import Link, { type LinkProps } from "next/link"
import type React from "react"
import { useState, createContext, useContext } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, X } from "lucide-react"

interface Links {
  label: string
  href: string
  icon: React.JSX.Element | React.ReactNode
}

interface SidebarContextProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  animate: boolean
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined)

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode
  open?: boolean
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
  animate?: boolean
}) => {
  const [openState, setOpenState] = useState(false)

  const open = openProp !== undefined ? openProp : openState
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState

  return <SidebarContext.Provider value={{ open, setOpen, animate }}>{children}</SidebarContext.Provider>
}

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode
  open?: boolean
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
  animate?: boolean
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  )
}

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  )
}

export const DesktopSidebar = ({ className, children, ...props }: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar()
  return (
    <motion.div
      className={cn("h-full px-4 py-4 hidden md:flex md:flex-col bg-slate-800 w-[60px] shrink-0", className)}
      animate={{
        width: animate ? (open ? "200px" : "60px") : "200px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export const MobileSidebar = ({ className, children, ...props }: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar()
  return (
    <>
      <div
        className={cn(
          "h-14 px-4 flex flex-row md:hidden items-center justify-between bg-slate-800 w-full shrink-0 sticky top-0 z-50",
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          <div className="h-5 w-6 bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm shrink-0" />
          <span className="text-white font-medium text-sm">GlobeAssist</span>
        </div>
        <button
          type="button"
          className="text-white p-2 hover:bg-slate-700 rounded-lg transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-[9998] md:hidden"
              onClick={() => setOpen(false)}
            />
            {/* Sidebar panel */}
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed top-0 left-0 h-full w-[280px] max-w-[85vw] bg-slate-800 p-6 z-[9999] flex flex-col justify-between md:hidden shadow-2xl",
                className,
              )}
            >
              <button
                type="button"
                className="absolute right-4 top-4 z-50 text-white p-2 hover:bg-slate-700 rounded-lg transition-colors"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export const SidebarLink = ({
  link,
  className,
  onClick,
  ...props
}: {
  link: Links
  className?: string
  onClick?: () => void
  props?: LinkProps
}) => {
  const { open, animate, setOpen } = useSidebar()

  const handleClick = () => {
    // Close sidebar on mobile after clicking a link
    if (window.innerWidth < 768) {
      setOpen(false)
    }
    onClick?.()
  }

  return (
    <Link
      href={link.href}
      className={cn("flex items-center justify-start gap-2 group/sidebar py-2", className)}
      onClick={handleClick}
      {...props}
    >
      {link.icon}
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-white text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </Link>
  )
}
