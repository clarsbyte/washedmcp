"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

export function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [cursorText, setCursorText] = useState("")
  const [isVisible, setIsVisible] = useState(false)
  const [cursorVariant, setCursorVariant] = useState<"default" | "button" | "link" | "text">("default")

  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)

  const springConfig = { damping: 25, stiffness: 400, mass: 0.5 }
  const cursorXSpring = useSpring(cursorX, springConfig)
  const cursorYSpring = useSpring(cursorY, springConfig)

  // Slower trailing ring
  const ringConfig = { damping: 35, stiffness: 200, mass: 0.8 }
  const ringXSpring = useSpring(cursorX, ringConfig)
  const ringYSpring = useSpring(cursorY, ringConfig)

  const moveCursor = useCallback(
    (e: MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
      setIsVisible(true)
    },
    [cursorX, cursorY],
  )

  useEffect(() => {
    const handleMouseDown = () => setIsClicking(true)
    const handleMouseUp = () => setIsClicking(false)

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const isButton = target.tagName === "BUTTON" || target.closest("button")
      const isLink = target.tagName === "A" || target.closest("a")
      const isInteractive = target.dataset.cursor === "pointer"

      if (isButton || isLink || isInteractive) {
        setIsHovering(true)
        setCursorVariant(isButton ? "button" : isLink ? "link" : "default")
        setCursorText(target.dataset.cursorText || "")
      }
    }

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const isButton = target.tagName === "BUTTON" || target.closest("button")
      const isLink = target.tagName === "A" || target.closest("a")
      const isInteractive = target.dataset.cursor === "pointer"

      if (isButton || isLink || isInteractive) {
        setIsHovering(false)
        setCursorVariant("default")
        setCursorText("")
      }
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    window.addEventListener("mousemove", moveCursor)
    window.addEventListener("mousedown", handleMouseDown)
    window.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("mouseover", handleMouseOver)
    document.addEventListener("mouseout", handleMouseOut)
    document.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      window.removeEventListener("mousemove", moveCursor)
      window.removeEventListener("mousedown", handleMouseDown)
      window.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("mouseover", handleMouseOver)
      document.removeEventListener("mouseout", handleMouseOut)
      document.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [moveCursor])

  // Hide on touch devices
  if (typeof window !== "undefined" && "ontouchstart" in window) {
    return null
  }

  return (
    <>
      {/* Main cursor dot */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9999] mix-blend-difference"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
      >
        <motion.div
          animate={{
            scale: isClicking ? 0.6 : isHovering ? 2.5 : 1,
            opacity: isVisible ? 1 : 0,
          }}
          transition={{ type: "spring", damping: 20, stiffness: 400 }}
          className="flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white"
        >
          {cursorText && (
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="whitespace-nowrap text-[8px] font-bold text-black"
            >
              {cursorText}
            </motion.span>
          )}
        </motion.div>
      </motion.div>

      {/* Trailing cursor ring */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9998]"
        style={{
          x: ringXSpring,
          y: ringYSpring,
        }}
      >
        <motion.div
          animate={{
            scale: isHovering ? 1.8 : 1,
            opacity: isVisible ? (isHovering ? 0.6 : 0.4) : 0,
            borderWidth: isHovering ? 2 : 1,
          }}
          transition={{ type: "spring", damping: 30, stiffness: 200 }}
          className="h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent"
        />
      </motion.div>

      {/* Extra decorative ring for button hover */}
      {isHovering && cursorVariant === "button" && (
        <motion.div
          className="pointer-events-none fixed left-0 top-0 z-[9997]"
          style={{
            x: ringXSpring,
            y: ringYSpring,
          }}
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 2.5, opacity: 0.2 }}
            exit={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent"
          />
        </motion.div>
      )}
    </>
  )
}
