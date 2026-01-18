"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import type { LucideIcon } from "lucide-react"
import * as Icons from "lucide-react"
import config from "@/config/landing-page.json"
import type { StackingFeaturesConfig } from "@/config/landing-page.schema"

export function StackingParallax() {
  const containerRef = useRef<HTMLDivElement>(null)

  const features = config.sections.stackingFeatures.features

  return (
    <section ref={containerRef} className="relative py-20 lg:py-32 overflow-hidden bg-(--background)">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            {config.sections.stackingFeatures.heading}
          </h2>
          <p className="text-xl text-(--foreground)/70 max-w-3xl mx-auto">
            {config.sections.stackingFeatures.description}
          </p>
        </motion.div>

        <div className="space-y-32">
          {features.map((feature, index) => (
            <ParallaxCard
              key={index}
              feature={feature}
              index={index}
              totalFeatures={features.length}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function ParallaxCard({
  feature,
  index,
  totalFeatures,
}: {
  feature: StackingFeaturesConfig["features"][number]
  index: number
  totalFeatures: number
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress: cardProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  })

  const isEven = index % 2 === 0
  const parallaxOffset = (totalFeatures - index) * 100

  const y = useTransform(
    cardProgress,
    [0, 1],
    [parallaxOffset, -parallaxOffset]
  )

  const rotate = useTransform(
    cardProgress,
    [0, 0.5, 1],
    [isEven ? -2 : 2, 0, isEven ? 2 : -2]
  )

  const scale = useTransform(
    cardProgress,
    [0, 0.5, 1],
    [0.9, 1, 0.9]
  )

  const opacity = useTransform(
    cardProgress,
    [0, 0.2, 0.8, 1],
    [0.3, 1, 1, 0.3]
  )

  const iconMap = Icons as unknown as Record<string, LucideIcon>
  const Icon = feature.icon ? iconMap[feature.icon] : null

  return (
    <motion.div
      ref={cardRef}
      style={{ y, rotate, scale, opacity }}
      className={`relative ${isEven ? "md:mr-auto md:ml-0" : "md:ml-auto md:mr-0"} max-w-3xl`}
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
        className={`relative rounded-3xl bg-gradient-to-br ${feature.gradient || "from-(--card) to-(--card)/50"} border border-(--border) p-10 md:p-12 shadow-2xl overflow-hidden`}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-(--accent)/10 to-transparent rounded-bl-full opacity-50" />

        <div className="relative z-10">
          <div className="flex items-start gap-6 mb-8">
            {Icon && (
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-(--accent)/20 text-(--accent) flex-shrink-0"
              >
                <Icon className="w-8 h-8" />
              </motion.div>
            )}
            <div>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">{feature.title}</h3>
              <p className="text-lg text-(--foreground)/70 leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
