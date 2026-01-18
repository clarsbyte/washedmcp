"use client"

import { useEffect, useRef } from "react"
import { useInView, motion, useSpring, useTransform } from "framer-motion"

interface AnimatedCounterProps {
  value: number
  suffix?: string
  prefix?: string
  className?: string
  duration?: number
}

export function AnimatedCounter({ value, suffix = "", prefix = "", className, duration = 2 }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const hasAnimatedRef = useRef(false)

  const springValue = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  })

  const displayValue = useTransform(springValue, (latest) => Math.round(latest).toLocaleString())

  useEffect(() => {
    if (isInView && !hasAnimatedRef.current) {
      springValue.set(value)
      hasAnimatedRef.current = true
    }
  }, [isInView, value, springValue])

  return (
    <span ref={ref} className={className}>
      {prefix}
      <motion.span>{displayValue}</motion.span>
      {suffix}
    </span>
  )
}
