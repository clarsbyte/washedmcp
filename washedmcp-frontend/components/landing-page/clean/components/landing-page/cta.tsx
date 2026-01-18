"use client"

import { useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Zap } from "lucide-react"
import { MagneticButton } from "./magnetic-button"
import { TextScramble } from "./text-scramble"
import config from "@/config/landing-page.json"

export function CTA() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [100, -100])
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 180])

  const cta = config.sections.cta
  const words = cta.headline.split(" ")
  const midpoint = Math.ceil(words.length / 2)
  const line1 = words.slice(0, midpoint).join(" ")
  const line2 = words.slice(midpoint).join(" ")

  if (!cta.enabled) return null

  return (
    <section ref={containerRef} className="relative overflow-hidden bg-primary px-6 py-24 sm:py-32 lg:px-8">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <motion.div
          style={{ y, rotate }}
          className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-white/5 blur-3xl"
        />
        <motion.div
          style={{ y: useTransform(scrollYProgress, [0, 1], [-100, 100]) }}
          className="absolute -right-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-white/5 blur-3xl"
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Floating particles */}
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 100 }}
            animate={{
              opacity: [0, 0.6, 0],
              y: [0, -150],
              x: [0, (Math.random() - 0.5) * 100],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 5,
              ease: "easeOut",
            }}
            className="absolute h-1 w-1 rounded-full bg-white/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${60 + Math.random() * 40}%`,
            }}
          />
        ))}

        {/* Animated lines */}
        <svg className="absolute inset-0 h-full w-full">
          <motion.line
            x1="0%"
            y1="20%"
            x2="100%"
            y2="80%"
            stroke="white"
            strokeOpacity={0.05}
            strokeWidth={1}
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          <motion.line
            x1="100%"
            y1="30%"
            x2="0%"
            y2="70%"
            stroke="white"
            strokeOpacity={0.05}
            strokeWidth={1}
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2, ease: "easeInOut", delay: 0.3 }}
          />
        </svg>
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <Sparkles className="h-4 w-4 text-white/80" />
          </motion.div>
          <span className="text-sm font-medium text-white/80">{cta.badge || "Available now"}</span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-6xl"
        >
          <TextScramble text={line1} delay={300} />
          <br />
          <span className="text-white/80">
            <TextScramble text={line2} delay={600} />
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mx-auto mt-6 max-w-xl text-pretty text-lg text-white/70"
        >
          {cta.description}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6"
        >
          <MagneticButton strength={0.2}>
            <Button asChild size="lg" variant="secondary" className="group relative gap-2 overflow-hidden px-8 py-6 text-base shadow-xl">
              <Link href={cta.cta.primary.link} data-cursor="pointer" data-cursor-text="GO">
                <Zap className="h-4 w-4" />
                <span className="relative z-10">{cta.cta.primary.text}</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                  className="relative z-10"
                >
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
                <motion.div
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                />
              </Link>
            </Button>
          </MagneticButton>

          <MagneticButton strength={0.15}>
            {cta.cta.secondary && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="gap-2 border-white/20 bg-transparent px-8 py-6 text-base text-white hover:bg-white/10 hover:text-white"
              >
                <Link href={cta.cta.secondary.link} data-cursor="pointer">
                  {cta.cta.secondary.text}
                </Link>
              </Button>
            )}
          </MagneticButton>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-white/50"
        >
          {(cta.trustBadges || []).map((badge) => (
            <div key={badge} className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{badge}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
