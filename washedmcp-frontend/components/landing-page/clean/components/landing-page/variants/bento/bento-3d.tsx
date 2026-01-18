"use client"

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { useState } from "react"
import config from "@/config/landing-page.json"

const GRID_SIZES = {
  small: "md:col-span-1 md:row-span-1",
  medium: "md:col-span-2 md:row-span-1",
  large: "md:col-span-2 md:row-span-2",
}

export function Bento3D() {
  const features = config.sections.bentoFeatures.features

  return (
    <section id="features" className="relative py-20 lg:py-32 overflow-hidden">
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[300px]">
          {features.map((feature, index) => (
            <BentoCard3D
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

function BentoCard3D({ feature, index }: { feature: any; index: number }) {
  const [isHovered, setIsHovered] = useState(false)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), {
    stiffness: 300,
    damping: 30,
  })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), {
    stiffness: 300,
    damping: 30,
  })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    mouseX.set(0)
    mouseY.set(0)
  }

  const Icon = feature.icon ? require("lucide-react")[feature.icon] : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={GRID_SIZES[feature.size as keyof typeof GRID_SIZES]}
      style={{ perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{
          rotateX: isHovered ? rotateX : 0,
          rotateY: isHovered ? rotateY : 0,
          transformStyle: "preserve-3d",
        }}
        className="relative h-full rounded-2xl bg-gradient-to-br from-(--card) to-(--card)/50 border border-(--border) overflow-hidden group"
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-(--accent)/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Content */}
        <div className="relative h-full p-6 flex flex-col justify-between z-10">
          <div>
            {Icon && (
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-(--accent)/10 text-(--accent) mb-4"
              >
                <Icon className="w-6 h-6" />
              </motion.div>
            )}
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-(--foreground)/70">{feature.description}</p>
          </div>

          {feature.stats && (
            <div className="flex items-center gap-4 mt-4">
              {feature.stats.map((stat: any, i: number) => (
                <div key={i}>
                  <div className="text-2xl font-bold text-(--accent)">{stat.value}</div>
                  <div className="text-sm text-(--foreground)/60">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3D shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            transform: "translateZ(50px)",
          }}
        />
      </motion.div>
    </motion.div>
  )
}
