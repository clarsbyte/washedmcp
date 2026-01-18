"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, Check, Play } from "lucide-react"
import Link from "next/link"
import { useRef } from "react"
import config from "@/config/landing-page.json"

export function HeroSplit() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  const x = useTransform(scrollYProgress, [0, 0.5], [0, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

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
  const midpoint = Math.ceil(words.length / 2)

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-(--background) via-(--accent)/5 to-(--background)" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <motion.div style={{ x, opacity }}>
            {/* Badge */}
            {hero.announcement && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-(--accent)/10 border border-(--accent)/20 mb-6"
              >
                <span className="text-sm font-medium text-(--accent)">
                  {hero.announcement.text}
                </span>
              </motion.div>
            )}

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            >
              {words.slice(0, midpoint).map((word, i) => (
                <span key={i} className="inline-block mr-3">
                  {word}
                </span>
              ))}
              <br />
              <span className="bg-gradient-to-r from-(--accent) to-(--accent)/60 bg-clip-text text-transparent">
                {words.slice(midpoint).join(" ")}
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-(--foreground)/70 mb-8 leading-relaxed max-w-xl"
            >
              {hero.subheadline}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 mb-8"
            >
              <Link href={hero.cta.primary.link}>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 50px oklch(0.65 0.2 160 / 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  className="group px-8 py-4 bg-(--accent) text-(--background) rounded-lg font-semibold flex items-center gap-2 shadow-glow transition-all"
                >
                  {hero.cta.primary.text}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              {hero.cta.secondary && (
                <Link href={hero.cta.secondary.link}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group px-8 py-4 bg-transparent backdrop-blur-sm rounded-lg font-semibold border border-(--foreground)/10 hover:border-(--accent)/30 transition-all flex items-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    {hero.cta.secondary.text}
                  </motion.button>
                </Link>
              )}
            </motion.div>

            {/* Social Proof */}
            {hero.socialProof && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-wrap items-center gap-6"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-(--accent)" />
                  <span className="text-sm text-(--foreground)/70">
                    {hero.socialProof.count} {hero.socialProof.text}
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-square lg:aspect-[4/5]">
              {/* Placeholder visual - will be replaced with actual content */}
              <motion.div
                animate={{
                  rotateY: [0, 10, 0],
                  rotateX: [0, -5, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ transformStyle: "preserve-3d" }}
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-(--accent)/20 to-(--accent)/5 backdrop-blur-sm border border-(--accent)/20 shadow-2xl overflow-hidden"
              >
                {/* Animated grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.55_0.15_160_/_0.1)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.55_0.15_160_/_0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

                {/* Floating elements */}
                <motion.div
                  animate={{
                    y: [0, -20, 0],
                    rotate: [0, 5, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-(--accent)/20 backdrop-blur-xl blur-xl"
                />
                <motion.div
                  animate={{
                    y: [0, 20, 0],
                    rotate: [0, -5, 0],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                  className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full bg-(--accent)/10 backdrop-blur-xl blur-xl"
                />
              </motion.div>

              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-(--accent)/20 to-(--accent)/10 rounded-3xl blur-3xl opacity-50" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
