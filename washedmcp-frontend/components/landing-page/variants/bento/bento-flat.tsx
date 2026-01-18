"use client"

import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import * as Icons from "lucide-react"
import config from "@/config/landing-page.json"
import type { BentoFeaturesConfig } from "@/config/landing-page.schema"

const GRID_SIZES = {
  small: "md:col-span-1",
  medium: "md:col-span-2",
  large: "md:col-span-2 md:row-span-2",
}

export function BentoFlat() {
  const features = config.sections.bentoFeatures.features

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden bg-(--background)">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            {config.sections.bentoFeatures.heading}
          </h2>
          <p className="text-xl text-(--foreground)/70 max-w-3xl mx-auto">
            {config.sections.bentoFeatures.description}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-(--border)/30 rounded-2xl overflow-hidden">
          {features.map((feature, index) => (
            <BentoCardFlat
              key={feature.title}
              feature={feature}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

type BentoFeature = BentoFeaturesConfig["features"][number] & {
  stats?: Array<{ value: string; label: string }>
}

function BentoCardFlat({ feature, index }: { feature: BentoFeature; index: number }) {
  const iconMap = Icons as unknown as Record<string, LucideIcon>
  const Icon = feature.icon ? iconMap[feature.icon] : null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`${GRID_SIZES[feature.size as keyof typeof GRID_SIZES]} bg-(--background) group`}
    >
      <motion.div
        whileHover={{ backgroundColor: "oklch(var(--card) / 0.5)" }}
        transition={{ duration: 0.2 }}
        className="relative h-full min-h-[300px] p-8 flex flex-col justify-between"
      >
        <div>
          {Icon && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-(--foreground)/5 text-(--foreground)/80 mb-6"
            >
              <Icon className="w-6 h-6" />
            </motion.div>
          )}
          <h3 className="text-xl font-semibold mb-3 text-(--foreground)">{feature.title}</h3>
          <p className="text-(--foreground)/60 leading-relaxed">{feature.description}</p>
        </div>

        {("stats" in feature) && feature.stats && (
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-(--border)/50">
            {feature.stats.map((stat, i) => (
              <div key={i}>
                <div className="text-2xl font-bold text-(--foreground)">{stat.value}</div>
                <div className="text-sm text-(--foreground)/50">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Subtle hover indicator */}
        <motion.div
          initial={{ width: 0 }}
          whileHover={{ width: "100%" }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-(--accent) to-transparent"
        />
      </motion.div>
    </motion.div>
  )
}
