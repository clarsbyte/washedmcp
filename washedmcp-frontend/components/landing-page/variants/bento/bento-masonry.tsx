"use client"

import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import * as Icons from "lucide-react"
import config from "@/config/landing-page.json"
import type { BentoFeaturesConfig } from "@/config/landing-page.schema"

const MASONRY_HEIGHTS = {
  small: "h-64",
  medium: "h-80",
  large: "h-96",
}

export function BentoMasonry() {
  const features = config.sections.bentoFeatures.features

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
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

        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {features.map((feature, index) => (
            <BentoCardMasonry
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

function BentoCardMasonry({ feature, index }: { feature: BentoFeature; index: number }) {
  const iconMap = Icons as unknown as Record<string, LucideIcon>
  const Icon = feature.icon ? iconMap[feature.icon] : null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="break-inside-avoid mb-6"
    >
      <motion.div
        whileHover={{
          scale: 1.02,
          boxShadow: "0 20px 40px -12px oklch(0.55 0.15 160 / 0.3)",
        }}
        transition={{ duration: 0.3 }}
        className={`relative ${MASONRY_HEIGHTS[feature.size as keyof typeof MASONRY_HEIGHTS]} rounded-2xl bg-(--card) border border-(--border) p-8 flex flex-col group overflow-hidden`}
      >
        {/* Animated gradient background */}
        <motion.div
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.55_0.15_160_/_0.05)_0%,transparent_50%,oklch(0.65_0.2_200_/_0.05)_100%)] bg-[length:200%_200%] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        />

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col">
          {Icon && (
            <motion.div
              whileHover={{ scale: 1.15, rotate: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-(--accent)/20 via-(--accent)/10 to-transparent text-(--accent) mb-6 shadow-sm group-hover:shadow-md transition-shadow"
            >
              <Icon className="w-8 h-8" />
            </motion.div>
          )}

          <h3 className="text-2xl font-bold mb-4 text-(--foreground)">{feature.title}</h3>
          <p className="text-(--foreground)/70 leading-relaxed flex-1">{feature.description}</p>

          {("stats" in feature) && feature.stats && (
            <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-(--border)/50">
              {feature.stats.map((stat, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-3xl font-bold bg-gradient-to-r from-(--accent) to-(--accent)/70 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-(--foreground)/60 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-(--accent)/10 to-transparent rounded-br-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-(--accent)/5 to-transparent rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Border glow on hover */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 rounded-2xl ring-1 ring-(--accent)/20 pointer-events-none"
        />
      </motion.div>
    </motion.div>
  )
}
