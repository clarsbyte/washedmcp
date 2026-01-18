"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, Check } from "lucide-react"
import Link from "next/link"
import { useRef } from "react"
import config from "@/config/landing-page.json"

export function HeroCentered() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])

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
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-(--background) via-(--accent)/5 to-(--background)" />

      {/* Content */}
      <motion.div
        style={{ opacity, scale }}
        className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center"
      >
        {/* Badge */}
        {hero.announcement && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-(--accent)/10 border border-(--accent)/20 mb-8"
          >
            <span className="text-sm font-medium text-(--accent)">
              {hero.announcement.text}
            </span>
          </motion.div>
        )}

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
              className="inline-block mr-3"
              style={{
                background: i % 3 === 0
                  ? "linear-gradient(to right, var(--accent), var(--foreground))"
                  : undefined,
                WebkitBackgroundClip: i % 3 === 0 ? "text" : undefined,
                WebkitTextFillColor: i % 3 === 0 ? "transparent" : undefined,
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
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-xl md:text-2xl text-(--foreground)/70 mb-12 max-w-3xl mx-auto leading-relaxed"
        >
          {hero.subheadline}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link href={hero.cta.primary.link}>
            <motion.button
              whileHover={{ scale: 1.05 }}
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
                className="px-8 py-4 bg-(--foreground)/5 backdrop-blur-sm rounded-lg font-semibold border border-(--foreground)/10 hover:border-(--foreground)/20 transition-all"
              >
                {hero.cta.secondary.text}
              </motion.button>
            </Link>
          )}
        </motion.div>

        {/* Social Proof */}
        {hero.socialProof && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-(--accent)" />
              <span className="text-sm text-(--foreground)/70">
                {hero.socialProof.count} {hero.socialProof.text}
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-(--accent)/10 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-(--accent)/10 to-transparent rounded-full blur-3xl"
        />
      </div>
    </section>
  )
}
