"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { motion, useMotionValue } from "framer-motion"

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

  // Smooth spring animation for spotlight position
  const spotlightX = useMotionValue(0)
  const spotlightY = useMotionValue(0)

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

  const spotlightStyle: React.CSSProperties & Record<string, string> = {
    opacity: isVisible ? 1 : 0,
    background: `radial-gradient(900px circle at var(--mouse-x) var(--mouse-y), oklch(0.65 0.2 160 / 0.02), transparent 40%)`,
    ["--mouse-x"]: `${mousePosition.x}px`,
    ["--mouse-y"]: `${mousePosition.y}px`,
  }

  return (
    <SpotlightContext.Provider value={{ mousePosition }}>
      <div className="relative">
        {/* Global spotlight effect with smooth animation */}
        <motion.div
          className="pointer-events-none fixed inset-0 z-30"
          style={spotlightStyle}
          transition={{ opacity: { duration: 0.3 } }}
        />

        {/* Secondary subtle glow */}
        <motion.div
          className="pointer-events-none fixed inset-0 z-30"
          style={{
            opacity: isVisible ? 0.125 : 0,
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, oklch(0.7 0.15 200 / 0.0125), transparent 50%)`,
          }}
          transition={{ opacity: { duration: 0.3 } }}
        />

        {children}
      </div>
    </SpotlightContext.Provider>
  )
}
