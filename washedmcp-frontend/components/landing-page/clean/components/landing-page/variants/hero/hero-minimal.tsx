"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import config from "@/config/landing-page.json"

export function HeroMinimal() {
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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-(--background)">
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.55_0.15_160_/_0.02)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.55_0.15_160_/_0.02)_1px,transparent_1px)] bg-[size:8rem_8rem]" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-32 text-center">
        {/* Badge */}
        {hero.announcement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-(--foreground)/10 mb-12"
          >
            <span className="text-xs font-medium text-(--foreground)/60 uppercase tracking-wide">
              {hero.announcement.text}
            </span>
          </motion.div>
        )}

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tight mb-8 text-(--foreground)"
        >
          {words.map((word, i, arr) => {
            const isLastWord = i === arr.length - 1
            return (
              <span
                key={i}
                className={`inline-block mr-4 ${isLastWord ? "font-medium" : ""}`}
              >
                {word}
              </span>
            )
          })}
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-(--foreground)/50 mb-16 max-w-2xl mx-auto leading-relaxed font-light"
        >
          {hero.subheadline}
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href={hero.cta.primary.link}>
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: "oklch(0.15 0 0)" }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="group px-10 py-4 bg-(--foreground) text-(--background) rounded-full font-medium flex items-center gap-2 transition-colors"
            >
              {hero.cta.primary.text}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
          {hero.cta.secondary && (
            <Link href={hero.cta.secondary.link}>
              <motion.button
                whileHover={{ scale: 1.02, borderColor: "oklch(0.55 0.15 160)" }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="px-10 py-4 bg-transparent rounded-full font-medium border border-(--foreground)/10 text-(--foreground)/80 hover:text-(--foreground) transition-all"
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
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 flex items-center justify-center gap-8 text-(--foreground)/40"
          >
            <div className="text-sm font-light">
              {hero.socialProof.count} {hero.socialProof.text}
            </div>
          </motion.div>
        )}
      </div>

      {/* Subtle accent */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-(--accent)/20 to-transparent" />
    </section>
  )
}
