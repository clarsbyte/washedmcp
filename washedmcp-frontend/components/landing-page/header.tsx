"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/landing-page/ui/button"
import { Menu, X, type LucideIcon } from "lucide-react"
import { MagneticButton } from "./magnetic-button"
import * as Icons from "lucide-react"
import config from "@/config/landing-page.json"

const navigation = [
  { name: "How it works", href: "#how-it-works" },
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
  { name: "Testimonials", href: "#testimonials" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const iconMap = Icons as unknown as Record<string, LucideIcon>
  const LogoIcon = config.brand.logo ? iconMap[config.brand.logo] : null

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${
        scrolled ? "border-b border-border/50 bg-background/80 shadow-sm backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex lg:flex-1"
        >
          <Link href="/" className="group flex items-center gap-2" data-cursor="pointer">
            {LogoIcon && (
              <motion.div
                whileHover={{ rotate: 180, scale: 1.1 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary"
              >
                <LogoIcon className="h-5 w-5 text-primary-foreground" />
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-xl bg-primary opacity-0 blur-lg transition-opacity group-hover:opacity-50" />
              </motion.div>
            )}
            <span className="text-xl font-bold text-foreground">{config.brand.name}</span>
          </Link>
        </motion.div>

        <div className="flex lg:hidden">
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-muted"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Toggle menu</span>
            <AnimatePresence mode="wait">
              {mobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-6 w-6" aria-hidden="true" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-6 w-6" aria-hidden="true" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        <div className="hidden lg:flex lg:gap-x-1">
          {navigation.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            >
              <MagneticButton strength={0.15}>
                <Link
                  href={item.href}
                  className="group relative rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  data-cursor="pointer"
                >
                  <span className="relative z-10">{item.name}</span>
                  {/* Hover background */}
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-muted"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                </Link>
              </MagneticButton>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-3"
        >
          <MagneticButton strength={0.15}>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link href="/dashboard" data-cursor="pointer">
                Log in
              </Link>
            </Button>
          </MagneticButton>
          <MagneticButton strength={0.2}>
            <Button asChild size="sm" className="relative overflow-hidden">
              <Link href={config.sections.hero.cta.primary.link} data-cursor="pointer" data-cursor-text="GO">
                <span className="relative z-10">{config.sections.hero.cta.primary.text}</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/30 to-accent/0"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />
              </Link>
            </Button>
          </MagneticButton>
        </motion.div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-border bg-background/95 backdrop-blur-xl lg:hidden"
          >
            <div className="space-y-1 px-6 pb-6 pt-4">
              {navigation.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    className="block rounded-lg px-4 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="mt-6 flex flex-col gap-3 pt-4"
              >
                <Button asChild variant="ghost" className="w-full justify-center">
                  <Link href="/dashboard">Log in</Link>
                </Button>
                <Button asChild className="w-full justify-center">
                  <Link href={config.sections.hero.cta.primary.link}>{config.sections.hero.cta.primary.text}</Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
