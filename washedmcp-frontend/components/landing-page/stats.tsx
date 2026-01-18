"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { AnimatedCounter } from "./animated-counter"
import * as Icons from "lucide-react"
import type { LucideIcon } from "lucide-react"
import config from "@/config/landing-page.json"

export function Stats() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const scale = useTransform(scrollYProgress, [0, 0.5], [0.95, 1])
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0.5, 1])
  const iconMap = Icons as unknown as Record<string, LucideIcon>

  return (
    <motion.section
      ref={containerRef}
      style={{ scale, opacity }}
      id="stats"
      className="relative border-y border-border bg-gradient-to-br from-card via-card to-accent/5 py-20 sm:py-24 overflow-hidden"
    >
      {/* Enhanced Background pattern */}
      <div className="pointer-events-none absolute inset-0">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />

        {/* Multiple animated gradient orbs for depth */}
        <motion.div
          animate={{
            x: [0, 80, 0],
            y: [0, -40, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-gradient-to-r from-[#06B6D4]/15 to-[#0EA5E9]/15 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -60, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-gradient-to-r from-[#8B5CF6]/12 to-[#EC4899]/12 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 40, 0],
            y: [0, -30, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-gradient-to-r from-[#10B981]/10 to-[#06B6D4]/10 blur-3xl"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">{config.sections.stats.heading}</h2>
          {config.sections.stats.description && <p className="mt-4 text-muted-foreground">{config.sections.stats.description}</p>}
        </motion.div>

        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8">
          {config.sections.stats.stats.map((stat, index) => {
            const Icon = stat.icon ? iconMap[stat.icon] : null
            return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                type: "spring",
                stiffness: 100,
              }}
              whileHover={{
                y: -12,
                scale: 1.05,
                boxShadow: "0 20px 40px oklch(0 0 0 / 0.15)"
              }}
              className="group relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-background via-background to-accent/5 p-6 text-center transition-all duration-300 lg:p-8 backdrop-blur-sm"
            >
              {/* Animated gradient border on hover */}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#06B6D4]/20 via-[#0EA5E9]/20 to-[#8B5CF6]/20 blur-xl"
              />

              {/* Enhanced Icon with gradient background */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={isInView ? { scale: 1, rotate: 0 } : {}}
                transition={{
                  type: "spring",
                  delay: index * 0.1 + 0.2,
                  stiffness: 200,
                }}
                whileHover={{ rotate: 5, scale: 1.1 }}
                className="relative mx-auto mb-4"
              >
                <div
                  className={`relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color} shadow-2xl mx-auto overflow-hidden`}
                >
                  {/* Shine effect */}
                  <motion.div
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                  />
                  {Icon && <Icon className="h-8 w-8 text-white relative z-10" />}
                </div>
              </motion.div>

              <motion.div
                className="relative z-10 text-5xl font-bold text-foreground sm:text-6xl"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: index * 0.1 + 0.3 }}
              >
                <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={2.5} />
              </motion.div>

              <motion.div
                className="relative z-10 mt-3 text-sm font-semibold text-muted-foreground sm:text-base"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: index * 0.1 + 0.4 }}
              >
                {stat.label}
              </motion.div>

              {/* Enhanced bottom accent line with gradient */}
              <motion.div
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                className={`absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r ${stat.color} origin-left shadow-lg`}
              />
            </motion.div>
            )
          })}
        </div>
      </div>
    </motion.section>
  )
}
