"use client"

import { motion } from "framer-motion"
import config from "@/config/landing-page.json"

const GRID_SIZES = {
  small: "md:col-span-1 md:row-span-1",
  medium: "md:col-span-2 md:row-span-1",
  large: "md:col-span-2 md:row-span-2",
}

export function BentoCards() {
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[280px]">
          {features.map((feature, index) => (
            <BentoCard
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

function BentoCard({ feature, index }: { feature: any; index: number }) {
  const Icon = feature.icon ? require("lucide-react")[feature.icon] : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={GRID_SIZES[feature.size as keyof typeof GRID_SIZES]}
    >
      <motion.div
        whileHover={{
          y: -8,
          boxShadow: "0 25px 50px -12px oklch(0.55 0.15 160 / 0.25)",
        }}
        transition={{ duration: 0.3 }}
        className="relative h-full rounded-2xl bg-(--card) border border-(--border) p-8 flex flex-col justify-between group shadow-lg"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-(--accent)/5 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Content */}
        <div className="relative z-10">
          {Icon && (
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-(--accent)/20 to-(--accent)/10 text-(--accent) mb-6 shadow-sm"
            >
              <Icon className="w-7 h-7" />
            </motion.div>
          )}
          <h3 className="text-xl font-bold mb-3 text-(--foreground)">{feature.title}</h3>
          <p className="text-(--foreground)/70 leading-relaxed">{feature.description}</p>
        </div>

        {feature.stats && (
          <div className="relative z-10 flex items-center gap-6 mt-6">
            {feature.stats.map((stat: any, i: number) => (
              <div key={i}>
                <div className="text-2xl font-bold bg-gradient-to-r from-(--accent) to-(--accent)/60 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-(--foreground)/60">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-(--accent)/10 to-transparent rounded-br-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </motion.div>
    </motion.div>
  )
}
