"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import config from "@/config/landing-page.json"

export function StackingMorph() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const features = config.sections.stackingFeatures.features

  useEffect(() => {
    const interval = setInterval(() => {
      setDirection(1)
      setActiveIndex((prev) => (prev + 1) % features.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [features.length])

  const handlePrevious = () => {
    setDirection(-1)
    setActiveIndex((prev) => (prev - 1 + features.length) % features.length)
  }

  const handleNext = () => {
    setDirection(1)
    setActiveIndex((prev) => (prev + 1) % features.length)
  }

  const activeFeature = features[activeIndex]
  const Icon = activeFeature.icon ? require("lucide-react")[activeFeature.icon] : null

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? 45 : -45,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-100%" : "100%",
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? -45 : 45,
    }),
  }

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden bg-(--background)">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            {config.sections.stackingFeatures.heading}
          </h2>
          <p className="text-xl text-(--foreground)/70 max-w-3xl mx-auto">
            {config.sections.stackingFeatures.description}
          </p>
        </motion.div>

        <div className="relative" style={{ perspective: "2000px" }}>
          {/* Background cards */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[1, 2].map((offset) => {
              const index = (activeIndex + offset) % features.length
              return (
                <motion.div
                  key={`bg-${index}`}
                  initial={{ scale: 1 - offset * 0.1, opacity: 0.3 - offset * 0.1 }}
                  animate={{
                    scale: 1 - offset * 0.1,
                    opacity: 0.3 - offset * 0.1,
                    z: -offset * 100,
                  }}
                  className="absolute w-full max-w-4xl h-[500px] rounded-3xl bg-(--card)/50 border border-(--border)/50 backdrop-blur-sm"
                />
              )
            })}
          </div>

          {/* Active card */}
          <div className="relative min-h-[500px] flex items-center justify-center">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={activeIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  duration: 0.8,
                  type: "spring",
                  stiffness: 100,
                  damping: 20,
                }}
                className="absolute w-full max-w-4xl"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  className={`relative rounded-3xl bg-gradient-to-br ${activeFeature.gradient || "from-(--card) to-(--card)/50"} border-2 border-(--border) p-12 md:p-16 shadow-2xl`}
                >
                  {/* Decorative glow */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-(--accent)/20 to-(--accent)/10 rounded-3xl blur-2xl opacity-50" />

                  <div className="relative z-10">
                    {Icon && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          duration: 0.6,
                          type: "spring",
                          stiffness: 200,
                        }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-(--accent)/20 text-(--accent) mb-8"
                      >
                        <Icon className="w-10 h-10" />
                      </motion.div>
                    )}

                    <motion.h3
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="text-4xl md:text-5xl font-bold mb-6"
                    >
                      {activeFeature.title}
                    </motion.h3>

                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="text-xl text-(--foreground)/70 leading-relaxed"
                    >
                      {activeFeature.description}
                    </motion.p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-12">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePrevious}
              className="p-3 rounded-full bg-(--card) border border-(--border) text-(--foreground) hover:bg-(--accent)/10 hover:border-(--accent)/30 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>

            <div className="flex items-center gap-2">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > activeIndex ? 1 : -1)
                    setActiveIndex(index)
                  }}
                  className="relative"
                >
                  <motion.div
                    animate={{
                      width: index === activeIndex ? 32 : 8,
                      backgroundColor: index === activeIndex
                        ? "var(--accent)"
                        : "oklch(var(--foreground) / 0.2)",
                    }}
                    className="h-2 rounded-full transition-all"
                  />
                </button>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleNext}
              className="p-3 rounded-full bg-(--card) border border-(--border) text-(--foreground) hover:bg-(--accent)/10 hover:border-(--accent)/30 transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  )
}
