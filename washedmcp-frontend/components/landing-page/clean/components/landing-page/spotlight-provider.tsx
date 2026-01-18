"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react"
import { motion, useSpring, useMotionValue } from "framer-motion"

interface SpotlightContextType {
  mousePosition: { x: number; y: number }
}

const SpotlightContext = createContext<SpotlightContextType>({
  mousePosition: { x: 0, y: 0 },
})

export function useSpotlight() {
  return useContext(SpotlightContext)
}

export function SpotlightProvider({ children }: { children: React.ReactNode }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Smooth spring animation for spotlight position
  const spotlightX = useMotionValue(0)
  const spotlightY = useMotionValue(0)
  const smoothX = useSpring(spotlightX, { damping: 30, stiffness: 200 })
  const smoothY = useSpring(spotlightY, { damping: 30, stiffness: 200 })

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
      spotlightX.set(e.clientX)
      spotlightY.set(e.clientY)
      setIsVisible(true)
    },
    [spotlightX, spotlightY],
  )

  useEffect(() => {
    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    window.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [handleMouseMove])

  return (
    <SpotlightContext.Provider value={{ mousePosition }}>
      <div ref={containerRef} className="relative">
        {/* Global spotlight effect with smooth animation */}
        <motion.div
          className="pointer-events-none fixed inset-0 z-30"
          style={{
            opacity: isVisible ? 1 : 0,
            background: `radial-gradient(900px circle at var(--mouse-x) var(--mouse-y), oklch(0.65 0.2 160 / 0.08), transparent 40%)`,
            // @ts-ignore - CSS custom properties
            "--mouse-x": `${mousePosition.x}px`,
            "--mouse-y": `${mousePosition.y}px`,
          }}
          transition={{ opacity: { duration: 0.3 } }}
        />

        {/* Secondary subtle glow */}
        <motion.div
          className="pointer-events-none fixed inset-0 z-30"
          style={{
            opacity: isVisible ? 0.5 : 0,
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, oklch(0.7 0.15 200 / 0.05), transparent 50%)`,
          }}
          transition={{ opacity: { duration: 0.3 } }}
        />

        {children}
      </div>
    </SpotlightContext.Provider>
  )
}
