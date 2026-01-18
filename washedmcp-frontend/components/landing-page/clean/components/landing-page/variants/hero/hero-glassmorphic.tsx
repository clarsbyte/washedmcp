"use client"

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { ArrowRight, Check } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef } from "react"
import config from "@/config/landing-page.json"

export function HeroGlassmorphic() {
  const ref = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const smoothMouseX = useSpring(mouseX, { damping: 50, stiffness: 200 })
  const smoothMouseY = useSpring(mouseY, { damping: 50, stiffness: 200 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      mouseX.set(e.clientX - rect.left)
      mouseY.set(e.clientY - rect.top)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [mouseX, mouseY])

  const hero = config.sections.hero

  // Handle headline structure (object with prefix/rotating/suffix or simple string)
  const getHeadlineText = () => {
    if (typeof hero.headline === 'object' && hero.headline !== null && 'prefix' in hero.headline) {
      return `${hero.headline.prefix} ${hero.headline.rotating?.[0] || ''} ${hero.headline.suffix || ''}`.trim()
    }
    return String(hero.headline || '')
  }

  const headlineText = getHeadlineText()
  const words = headlineText.split(" ")

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-oklch(0.95_0.02_160) via-oklch(0.93_0.03_180) to-oklch(0.90_0.04_200)" />

      {/* Floating gradient orbs */}
      <motion.div
        style={{
          x: useTransform(smoothMouseX, [0, 1000], [-50, 50]),
          y: useTransform(smoothMouseY, [0, 1000], [-50, 50]),
        }}
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-(--accent)/40 to-oklch(0.70_0.15_200_/_0.3) blur-3xl"
      />
      <motion.div
        style={{
          x: useTransform(smoothMouseX, [0, 1000], [50, -50]),
          y: useTransform(smoothMouseY, [0, 1000], [50, -50]),
        }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-gradient-to-tl from-oklch(0.65_0.2_220_/_0.3) to-oklch(0.70_0.15_180_/_0.4) blur-3xl"
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        {/* Glass card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl p-12 md:p-16 shadow-2xl"
          style={{
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.2)",
          }}
        >
          {/* Badge */}
          {hero.announcement && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 backdrop-blur-sm border border-white/50 mb-8 shadow-sm"
            >
              <span className="text-sm font-semibold text-(--foreground)/80">
                {hero.announcement.text}
              </span>
            </motion.div>
          )}

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 text-(--foreground)"
          >
            {words.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.05 }}
                className="inline-block mr-4"
                style={{
                  background: i % 3 === 1
                    ? "linear-gradient(135deg, oklch(0.55 0.15 160), oklch(0.65 0.2 200))"
                    : undefined,
                  WebkitBackgroundClip: i % 3 === 1 ? "text" : undefined,
                  WebkitTextFillColor: i % 3 === 1 ? "transparent" : undefined,
                }}
              >
                {word}
              </motion.span>
            ))}
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl md:text-2xl text-(--foreground)/70 mb-10 max-w-3xl leading-relaxed"
          >
            {hero.subheadline}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-12"
          >
            <Link href={hero.cta.primary.link}>
              <motion.button
                whileHover={{
                  scale: 1.05,
                  backgroundColor: "oklch(0.55 0.15 160)",
                  boxShadow: "0 20px 50px oklch(0.55 0.15 160 / 0.4)",
                }}
                whileTap={{ scale: 0.95 }}
                className="group px-8 py-4 bg-(--accent) text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg transition-all backdrop-blur-sm"
              >
                {hero.cta.primary.text}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
            {hero.cta.secondary && (
              <Link href={hero.cta.secondary.link}>
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: "rgba(255, 255, 255, 0.5)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white/30 backdrop-blur-sm rounded-xl font-semibold border border-white/40 hover:border-white/60 transition-all text-(--foreground)/80"
                >
                  {hero.cta.secondary.text}
                </motion.button>
              </Link>
            )}
          </motion.div>

          {/* Social Proof */}
          {hero.socialProof && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-8 border-t border-white/20"
            >
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-(--accent)" />
                <span className="text-sm text-(--foreground)/70 font-medium">
                  {hero.socialProof.count} {hero.socialProof.text}
                </span>
              </div>
            </motion.div>
          )}

          {/* Glass reflection */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-3xl pointer-events-none" />
        </motion.div>
      </div>

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            y: [null, Math.random() * window.innerHeight],
            x: [null, Math.random() * window.innerWidth],
          }}
          transition={{
            duration: Math.random() * 10 + 20,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear",
          }}
          className="absolute w-1 h-1 rounded-full bg-white/30 blur-sm"
        />
      ))}
    </section>
  )
}
