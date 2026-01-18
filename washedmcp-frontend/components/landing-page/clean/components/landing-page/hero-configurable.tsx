"use client"

import { useRef, useEffect, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play, Sparkles, LucideIcon } from "lucide-react"
import { MagneticButton } from "./magnetic-button"
import type { HeroConfig } from "@/config/landing-page.schema"
import * as Icons from "lucide-react"

interface HeroConfigurableProps {
  config: HeroConfig
}

/**
 * Data-driven Hero component
 *
 * This version accepts configuration instead of hardcoded values.
 * Use this for generating multiple landing page variants.
 */
export function HeroConfigurable({ config }: HeroConfigurableProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, 300])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9])
  const blur = useTransform(scrollYProgress, [0, 0.3], [0, 10])

  // Parallax for background elements
  const bgY1 = useTransform(scrollYProgress, [0, 1], [0, -200])
  const bgY2 = useTransform(scrollYProgress, [0, 1], [0, -100])
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 45])

  // Mouse parallax for floating elements
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const { innerWidth, innerHeight } = window
      setMousePosition({
        x: (clientX - innerWidth / 2) / 50,
        y: (clientY - innerHeight / 2) / 50,
      })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Word rotation
  const words = config.headline.rotating || []
  const [currentWord, setCurrentWord] = useState(0)

  useEffect(() => {
    if (words.length === 0) return

    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [words.length])

  // Get icon component dynamically
  const getIcon = (iconName?: string): LucideIcon => {
    if (!iconName) return Sparkles
    return (Icons as any)[iconName] || Sparkles
  }

  const AnnouncementIcon = config.announcement?.icon
    ? getIcon(config.announcement.icon)
    : Sparkles

  // Don't render if disabled
  if (!config.enabled) return null

  return (
    <section ref={containerRef} className="relative min-h-screen overflow-hidden px-6 py-24 sm:py-32 lg:px-8">
      {/* Animated mesh gradient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Primary gradient orb */}
        <motion.div
          style={{ y: bgY1, rotate }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="absolute -right-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-gradient-to-br from-accent/30 via-accent/10 to-transparent blur-3xl"
        />

        {/* Secondary gradient orb */}
        <motion.div
          style={{ y: bgY2 }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="absolute -bottom-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-accent/20 via-primary/5 to-transparent blur-3xl"
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Floating particles */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.5, 0],
              y: [-20, -100 - Math.random() * 100],
              x: [0, (Math.random() - 0.5) * 100],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 5,
              ease: "easeOut",
            }}
            className="absolute h-1 w-1 rounded-full bg-accent/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${60 + Math.random() * 40}%`,
            }}
          />
        ))}
      </div>

      <motion.div
        style={{ y, opacity, scale, filter: `blur(${blur}px)` } as any}
        className="relative mx-auto max-w-5xl text-center"
      >
        {/* Announcement badge */}
        {config.announcement && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 text-sm font-medium text-muted-foreground shadow-lg backdrop-blur-sm"
          >
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              className="flex h-2 w-2 rounded-full bg-accent"
            />
            <AnnouncementIcon className="h-3.5 w-3.5 text-accent" />
            <span>{config.announcement.text}</span>
            <ArrowRight className="h-3 w-3" />
          </motion.div>
        )}

        {/* Main headline with word rotation */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl xl:text-8xl"
        >
          {config.headline.prefix && <span className="block">{config.headline.prefix}</span>}

          {words.length > 0 && (
            <span className="relative mt-2 block h-[1.2em] overflow-hidden">
              {words.map((word, index) => (
                <motion.span
                  key={word}
                  initial={{ y: "100%" }}
                  animate={{
                    y: currentWord === index ? "0%" : currentWord > index ? "-100%" : "100%",
                  }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 bg-gradient-to-r from-accent via-accent to-accent/70 bg-clip-text text-transparent"
                >
                  {word}
                </motion.span>
              ))}
            </span>
          )}

          {config.headline.suffix && <span className="block">{config.headline.suffix}</span>}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mx-auto mt-8 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl"
        >
          {config.subheadline}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6"
        >
          <MagneticButton strength={0.2}>
            <Button
              size="lg"
              className="group relative gap-2 overflow-hidden px-8 py-6 text-base"
              data-cursor="pointer"
              data-cursor-text="GO"
            >
              <span className="relative z-10">{config.cta.primary.text}</span>
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                className="relative z-10"
              >
                <ArrowRight className="h-4 w-4" />
              </motion.span>
              {/* Shine effect */}
              <motion.div
                initial={{ x: "-100%", opacity: 0 }}
                whileHover={{ x: "100%", opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />
            </Button>
          </MagneticButton>

          {config.cta.secondary && (
            <MagneticButton strength={0.2}>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 px-8 py-6 text-base bg-transparent"
                data-cursor="pointer"
              >
                <Play className="h-4 w-4" />
                {config.cta.secondary.text}
              </Button>
            </MagneticButton>
          )}
        </motion.div>

        {/* Social proof */}
        {config.socialProof && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground"
          >
            <div className="flex -space-x-3">
              {[...Array(config.socialProof.avatars)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="h-10 w-10 overflow-hidden rounded-full border-2 border-background bg-gradient-to-br from-muted to-muted-foreground/20"
                >
                  <img
                    src={`/professional-avatar.png?height=40&width=40&query=professional avatar ${i}`}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </motion.div>
              ))}
            </div>
            <div className="text-left">
              <div className="font-semibold text-foreground">{config.socialProof.count}</div>
              <div className="text-xs">{config.socialProof.text}</div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Hero image with floating elements */}
      {config.image && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="relative mx-auto mt-20 max-w-6xl"
        >
          {/* Floating cards with mouse parallax */}
          <motion.div
            style={{
              x: mousePosition.x * 2,
              y: mousePosition.y * 2,
            }}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="absolute -left-8 top-1/4 z-20 hidden rounded-xl border border-border bg-card/90 p-4 shadow-2xl backdrop-blur-sm lg:block"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20"
              >
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </motion.div>
              <div>
                <div className="text-sm font-medium text-foreground">Workflow Complete</div>
                <div className="text-xs text-muted-foreground">2.3s execution time</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            style={{
              x: mousePosition.x * -1.5,
              y: mousePosition.y * -1.5,
            }}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="absolute -right-8 top-1/3 z-20 hidden rounded-xl border border-border bg-card/90 p-4 shadow-2xl backdrop-blur-sm lg:block"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">AI Suggestion</div>
                <div className="text-xs text-muted-foreground">Optimize this step?</div>
              </div>
            </div>
          </motion.div>

          {/* Main dashboard image */}
          <motion.div
            whileHover={{ scale: 1.02, rotateX: 2, rotateY: -2 }}
            transition={{ duration: 0.4 }}
            style={{ transformPerspective: 1000 }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            {/* Animated gradient border on hover */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <div
                className="absolute inset-[-2px] rounded-2xl bg-gradient-to-r from-accent via-accent/50 to-accent animate-pulse"
                style={{ padding: "2px" }}
              >
                <div className="h-full w-full rounded-2xl bg-card" />
              </div>
            </div>

            {/* Glow effect */}
            <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-accent/20 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

            <img
              src={config.image.src}
              alt={config.image.alt}
              className="relative w-full transition-transform duration-500 group-hover:scale-[1.02]"
            />

            {/* Reflection effect */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5" />
          </motion.div>
        </motion.div>
      )}
    </section>
  )
}
