"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useInView } from "framer-motion"

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"

interface TextScrambleProps {
  text: string
  className?: string
  delay?: number
  duration?: number
}

export function TextScramble({ text, className, delay = 0, duration = 1000 }: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(text)
  const [isScrambling, setIsScrambling] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  useEffect(() => {
    if (!isInView) return

    const timeout = setTimeout(() => {
      setIsScrambling(true)
      let iteration = 0
      const maxIterations = text.length * 3

      const interval = setInterval(() => {
        setDisplayText(
          text
            .split("")
            .map((char, index) => {
              if (char === " ") return " "
              if (index < iteration / 3) return text[index]
              return chars[Math.floor(Math.random() * chars.length)]
            })
            .join(""),
        )

        iteration++
        if (iteration >= maxIterations) {
          clearInterval(interval)
          setDisplayText(text)
          setIsScrambling(false)
        }
      }, duration / maxIterations)

      return () => clearInterval(interval)
    }, delay)

    return () => clearTimeout(timeout)
  }, [text, isInView, delay, duration])

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: isInView ? 1 : 0 }}
      transition={{ duration: 0.5 }}
    >
      {displayText}
    </motion.span>
  )
}
