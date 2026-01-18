"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import type { LucideIcon } from "lucide-react"
import * as Icons from "lucide-react"
import config from "@/config/landing-page.json"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export function StackingScroll() {
  const containerRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])

  const features = config.sections.stackingFeatures.features
  const iconMap = Icons as unknown as Record<string, LucideIcon>

  useEffect(() => {
    if (!containerRef.current || cardsRef.current.length === 0) return

    const ctx = gsap.context(() => {
      const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[]
      const totalCards = cards.length

      // INITIAL STATE: Set all cards except first to scale 0.9
      cards.forEach((card, index) => {
        if (index > 0) {
          gsap.set(card, { scale: 0.9 })
        }
      })

      // THE MASTER TIMELINE - ONE TIMELINE TO RULE THEM ALL
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          pin: true,
          start: "top top",
          end: `+=${totalCards * window.innerHeight}`,
          scrub: 1, // 1-second friction for premium feel
        }
      })

      // THE SEQUENCE: Animate each card (except last)
      cards.forEach((card, index) => {
        if (index < totalCards - 1) {
          const nextCard = cards[index + 1]

          // Move current card UP and AWAY + fade out
          tl.to(card, {
            yPercent: -100,
            opacity: 0,
            duration: 1,
          }, index) // Position in timeline

          // Simultaneously scale up next card from 0.9 to 1.0
          .to(nextCard, {
            scale: 1,
            duration: 1,
          }, index) // Same position = simultaneous
        }
      })
    }, containerRef)

    return () => {
      ctx.revert()
    }
  }, [features.length])

  return (
    <section className="relative bg-(--background) -mt-20">
      {/* Header above the pinned section - reduced spacing */}
      <div className="pt-32 pb-12 text-center">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            {config.sections.stackingFeatures.heading}
          </h2>
          <p className="text-xl text-(--foreground)/70">
            {config.sections.stackingFeatures.description}
          </p>
        </div>
      </div>

      {/* PINNED CONTAINER: h-screen, overflow-hidden */}
      <div
        ref={containerRef}
        className="relative h-screen overflow-hidden flex items-center justify-center"
        id="how-it-works"
      >
        {/* Cards positioned absolute inset-0 */}
        <div className="relative w-full max-w-5xl h-[600px] px-6">
          {features.map((feature, index) => {
            const Icon = feature.icon ? iconMap[feature.icon] : null
            const zIndex = 10 - index // First card highest z-index

            return (
              <div
                key={index}
                ref={(el) => {
                  cardsRef.current[index] = el
                }}
                className="absolute inset-0 rounded-3xl bg-white shadow-2xl border border-white/20 p-8 md:p-12"
                style={{ zIndex }}
              >
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    {Icon && (
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-(--accent)/20 text-(--accent) mb-8">
                        <Icon className="w-8 h-8" />
                      </div>
                    )}
                    <h3 className="text-3xl md:text-4xl font-bold mb-6 text-[#1E293B]">
                      {feature.title}
                    </h3>
                    <p className="text-lg md:text-xl text-[#64748B] leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Card number indicator */}
                  <div className="text-sm text-[#94A3B8] font-medium">
                    {String(index + 1).padStart(2, '0')} / {String(features.length).padStart(2, '0')}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
