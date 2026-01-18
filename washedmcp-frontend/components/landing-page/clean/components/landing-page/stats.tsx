"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { AnimatedCounter } from "./animated-counter"
import * as Icons from "lucide-react"
import config from "@/config/landing-page.json"

const TAILWIND_GRADIENT_SAFE_LIST = [
  "from-blue-500 to-cyan-500",
  "from-amber-500 to-orange-500",
  "from-emerald-500 to-teal-500",
  "from-violet-500 to-purple-500",
] as const

export function Stats() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const scale = useTransform(scrollYProgress, [0, 0.5], [0.95, 1])
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0.5, 1])

  return (
    <motion.section
      ref={containerRef}
      style={{ scale, opacity }}
      id="stats"
      className="relative border-y border-border bg-card py-20 sm:py-24"
    >
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
        {/* Animated gradient orbs */}
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="absolute -left-32 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 30, 0] }}
          transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="absolute -right-32 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl"
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
            const Icon = stat.icon ? (Icons as any)[stat.icon] : null
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
              whileHover={{ y: -8, scale: 1.03 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-background p-6 text-center transition-all duration-300 hover:border-accent/50 hover:shadow-2xl lg:p-8"
            >
              {/* Hover gradient background */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              {/* Animated border glow on hover */}
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  boxShadow: "inset 0 0 30px rgba(var(--accent), 0.1)",
                }}
              />

              {/* Icon with gradient background */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={isInView ? { scale: 1, rotate: 0 } : {}}
                transition={{
                  type: "spring",
                  delay: index * 0.1 + 0.2,
                  stiffness: 200,
                }}
                className="relative mx-auto mb-4"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg mx-auto`}
                >
                  {Icon && <Icon className="h-7 w-7 text-white" />}
                </div>
                {/* Glow effect */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.color} opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-40`}
                />
              </motion.div>

              <motion.div
                className="text-4xl font-bold text-foreground sm:text-5xl"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: index * 0.1 + 0.3 }}
              >
                <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={2.5} />
              </motion.div>

              <motion.div
                className="mt-2 text-sm font-medium text-muted-foreground sm:text-base"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: index * 0.1 + 0.4 }}
              >
                {stat.label}
              </motion.div>

              {/* Bottom accent line */}
              <motion.div
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${stat.color} origin-left`}
              />
            </motion.div>
            )
          })}
        </div>
      </div>
    </motion.section>
  )
}
