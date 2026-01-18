"use client"

import { useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Check, Sparkles, Zap } from "lucide-react"
import { MagneticButton } from "./magnetic-button"
import { AnimatedCounter } from "./animated-counter"
import config from "@/config/landing-page.json"

const TAILWIND_TIER_GRADIENT_SAFE_LIST = ["from-slate-500 to-slate-600", "from-accent to-accent/80"] as const

export function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly")
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  const pricing = config.sections.pricing
  const annualDiscount = pricing.annualDiscount ?? 20
  const annualMultiplier = 1 - annualDiscount / 100

  if (!pricing.enabled) return null

  return (
    <section ref={sectionRef} id="pricing" className="relative overflow-hidden px-6 py-24 sm:py-32 lg:px-8">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-sm font-semibold uppercase tracking-wide text-accent"
          >
            Pricing
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            {pricing.heading}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-pretty text-lg text-muted-foreground"
          >
            {pricing.description}
          </motion.p>

          {/* Billing toggle */}
          {pricing.billingToggle && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex items-center justify-center gap-4"
            >
              <span className={`text-sm ${billingPeriod === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "annual" : "monthly")}
                className="relative h-7 w-14 rounded-full bg-muted p-1 transition-colors hover:bg-muted/80"
              >
                <motion.div
                  animate={{ x: billingPeriod === "annual" ? 26 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="h-5 w-5 rounded-full bg-accent shadow-sm"
                />
              </button>
              <span className={`text-sm ${billingPeriod === "annual" ? "text-foreground" : "text-muted-foreground"}`}>
                Annual
                <span className="ml-1.5 rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                  Save {annualDiscount}%
                </span>
              </span>
            </motion.div>
          )}
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-3 lg:gap-8">
          {pricing.tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              whileHover={{ y: -8 }}
              className={`group relative flex flex-col overflow-hidden rounded-3xl border p-8 transition-all duration-300 ${
                tier.featured
                  ? "border-accent bg-card shadow-xl shadow-accent/10 ring-1 ring-accent"
                  : "border-border bg-card hover:border-accent/50 hover:shadow-lg"
              }`}
            >
              {/* Featured badge */}
              {tier.featured && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                  className="absolute -top-px left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-b-xl bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground"
                >
                  <Sparkles className="h-3 w-3" />
                  Most Popular
                </motion.div>
              )}

              {/* Hover gradient */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative mb-6">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tier.gradient}`}
                  >
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{tier.name}</h3>
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  {tier.price !== null ? (
                    <>
                      <span className="text-4xl font-bold text-foreground lg:text-5xl">
                        $
                        <AnimatedCounter
                          value={billingPeriod === "annual" ? Math.round(tier.price * annualMultiplier) : tier.price}
                          duration={1}
                        />
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </>
                  ) : (
                    <span className="text-4xl font-bold text-foreground lg:text-5xl">Custom</span>
                  )}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{tier.description}</p>
              </div>

              <ul className="relative mb-8 flex-1 space-y-3">
                {tier.features.map((feature, featureIndex) => (
                  <motion.li
                    key={feature}
                    initial={{ opacity: 0, x: -10 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.3, delay: 0.4 + featureIndex * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${tier.featured ? "bg-accent/20" : "bg-muted"}`}
                    >
                      <Check className={`h-3 w-3 ${tier.featured ? "text-accent" : "text-muted-foreground"}`} />
                    </div>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </motion.li>
                ))}
              </ul>

              <MagneticButton strength={0.15} className="w-full">
                <Button
                  variant={tier.featured ? "default" : "outline"}
                  className={`relative w-full overflow-hidden ${tier.featured ? "shadow-lg shadow-accent/20" : ""}`}
                  data-cursor="pointer"
                >
                  <span className="relative z-10">{tier.cta}</span>
                  {tier.featured && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-accent/0 via-white/20 to-accent/0"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    />
                  )}
                </Button>
              </MagneticButton>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
