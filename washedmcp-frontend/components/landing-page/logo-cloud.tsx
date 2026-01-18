"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import config from "@/config/landing-page.json"

function TrustBadge({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2">
      <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      <span>{children}</span>
    </div>
  )
}

export function LogoCloud() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  const logoCloud = config.sections.logoCloud
  const logos = logoCloud?.logos ?? []
  const marquee = [...logos, ...logos, ...logos, ...logos]

  if (!logoCloud?.enabled) return null

  return (
    <section ref={ref} id="integrations" className="relative border-y border-border bg-muted/30 py-16">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-transparent to-background opacity-50" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center text-sm font-medium uppercase tracking-wider text-muted-foreground"
        >
          {logoCloud.heading || "Works with your existing tools"}
        </motion.p>

        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-muted/30 via-muted/30 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-muted/30 via-muted/30 to-transparent" />

          <motion.div
            animate={{ x: [0, -1920] }}
            transition={{
              x: {
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
                duration: 40,
                ease: "linear",
              },
            }}
            className="flex gap-16 py-4"
          >
            {marquee.map((logo, index) => (
              <motion.div
                key={`${logo.name}-${index}`}
                className="flex h-12 shrink-0 items-center justify-center"
                whileHover={{ scale: 1.1 }}
              >
                <div className="flex items-center gap-3 text-muted-foreground/50 transition-all duration-300 hover:text-foreground">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background text-xs font-bold text-muted-foreground">
                    {logo.name.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="text-base font-semibold tracking-tight">{logo.name}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-8 text-xs text-muted-foreground"
        >
          <TrustBadge>MCP-native</TrustBadge>
          <TrustBadge>Neo4j-backed graph</TrustBadge>
          <TrustBadge>Freshness alerts</TrustBadge>
        </motion.div>
      </div>
    </section>
  )
}
