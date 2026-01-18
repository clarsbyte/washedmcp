"use client"

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef } from "react"
import config from "@/config/landing-page.json"

export function HeroBold() {
  const ref = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const smoothMouseX = useSpring(mouseX, { damping: 50, stiffness: 300 })
  const smoothMouseY = useSpring(mouseY, { damping: 50, stiffness: 300 })

  const rotateX = useTransform(smoothMouseY, [-300, 300], [10, -10])
  const rotateY = useTransform(smoothMouseX, [-300, 300], [-10, 10])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      mouseX.set(e.clientX - centerX)
      mouseY.set(e.clientY - centerY)
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
      className="relative h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-black">
        <motion.div
          style={{
            background: `radial-gradient(circle at ${smoothMouseX}px ${smoothMouseY}px, oklch(0.55 0.15 160 / 0.3), transparent 50%)`,
          }}
          className="absolute inset-0"
        />

        {/* Grid pattern */}
        <motion.div
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear",
          }}
          className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.55_0.15_160_/_0.1)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.55_0.15_160_/_0.1)_1px,transparent_1px)] bg-[size:6rem_6rem]"
        />

        {/* Gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-(--accent)/30 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-(--accent)/20 to-transparent rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative z-10 max-w-6xl mx-auto px-6 text-center"
      >
        {/* Badge */}
        {hero.announcement && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-(--accent)/20 backdrop-blur-xl border border-(--accent)/30 mb-8 shadow-glow"
          >
            <Sparkles className="w-4 h-4 text-(--accent)" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">
              {hero.announcement.text}
            </span>
          </motion.div>
        )}

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-8 text-white"
          style={{ transformStyle: "preserve-3d", transform: "translateZ(50px)" }}
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.1 }}
              className="inline-block mr-4"
              style={{
                background: i % 2 === 0
                  ? "linear-gradient(135deg, var(--accent), oklch(0.75 0.2 200))"
                  : undefined,
                WebkitBackgroundClip: i % 2 === 0 ? "text" : undefined,
                WebkitTextFillColor: i % 2 === 0 ? "transparent" : undefined,
              }}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-3xl text-white/80 mb-12 max-w-4xl mx-auto font-medium leading-relaxed"
          style={{ transformStyle: "preserve-3d", transform: "translateZ(30px)" }}
        >
          {hero.subheadline}
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
          style={{ transformStyle: "preserve-3d", transform: "translateZ(40px)" }}
        >
          <Link href={hero.cta.primary.link}>
            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 80px oklch(0.65 0.2 160 / 0.6)",
              }}
              whileTap={{ scale: 0.95 }}
              className="group px-12 py-5 bg-gradient-to-r from-(--accent) to-oklch(0.65_0.2_200) text-black rounded-xl font-bold text-lg flex items-center gap-3 shadow-glow"
            >
              {hero.cta.primary.text}
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </motion.button>
          </Link>
          {hero.cta.secondary && (
            <Link href={hero.cta.secondary.link}>
              <motion.button
                whileHover={{ scale: 1.05, borderColor: "oklch(0.55 0.15 160)" }}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-5 bg-white/5 backdrop-blur-xl rounded-xl font-bold text-lg border-2 border-white/20 text-white hover:bg-white/10 transition-all"
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
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-white/60"
          >
            <div className="text-lg font-semibold">
              {hero.socialProof.count} {hero.socialProof.text}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Scan line effect */}
      <motion.div
        animate={{
          top: ["0%", "100%"],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-(--accent)/50 to-transparent"
      />
    </section>
  )
}
