"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import config from "@/config/landing-page.json"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export function StackingScroll() {
  const containerRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement[]>([])
  const progressRef = useRef<HTMLDivElement>(null)

  const features = config.sections.stackingFeatures.features

  useEffect(() => {
    if (!containerRef.current || cardsRef.current.length === 0) return

    const ctx = gsap.context(() => {
      const cards = cardsRef.current
      const totalCards = cards.length

      cards.forEach((card, index) => {
        if (index === totalCards - 1) return

        const scale = 1 - (totalCards - index - 1) * 0.05
        const yOffset = (totalCards - index - 1) * 20

        gsap.set(card, {
          transformOrigin: "center top",
          scale,
          y: yOffset,
        })

        ScrollTrigger.create({
          trigger: containerRef.current,
          start: `top-=${index * 100} top`,
          end: `+=${window.innerHeight}`,
          scrub: true,
          onUpdate: (self) => {
            const progress = self.progress
            const exitProgress = Math.max(0, (progress - 0.5) * 2)

            gsap.to(card, {
              y: -window.innerHeight * exitProgress,
              opacity: 1 - exitProgress,
              duration: 0.1,
            })
          },
        })
      })

      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: `+=${window.innerHeight * totalCards}`,
        scrub: true,
        pin: true,
        onUpdate: (self) => {
          if (progressRef.current) {
            progressRef.current.style.transform = `scaleY(${self.progress})`
          }
        },
      })
    }, containerRef)

    return () => ctx.revert()
  }, [features])

  const addToRefs = (el: HTMLDivElement | null) => {
    if (el && !cardsRef.current.includes(el)) {
      cardsRef.current.push(el)
    }
  }

  return (
    <section id="how-it-works" className="relative bg-(--background)">
      <div ref={containerRef} className="relative min-h-[400vh]">
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
          <div className="max-w-5xl w-full px-6">
            <div className="mb-16 text-center">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                {config.sections.stackingFeatures.heading}
              </h2>
              <p className="text-xl text-(--foreground)/70">
                {config.sections.stackingFeatures.description}
              </p>
            </div>

            <div className="relative">
              {features.map((feature, index) => {
                const Icon = feature.icon ? require("lucide-react")[feature.icon] : null
                return (
                  <div
                    key={index}
                    ref={addToRefs}
                    className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient || "from-(--card) to-(--card)/50"} border border-(--border) p-12 shadow-2xl`}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex-1">
                        {Icon && (
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-(--accent)/20 text-(--accent) mb-8">
                            <Icon className="w-8 h-8" />
                          </div>
                        )}
                        <h3 className="text-4xl font-bold mb-6">{feature.title}</h3>
                        <p className="text-xl text-(--foreground)/70 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Progress indicator */}
          <div className="fixed right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
            <div className="w-1 h-32 bg-(--border)/30 rounded-full overflow-hidden">
              <div
                ref={progressRef}
                className="w-full bg-(--accent) origin-top rounded-full transition-transform"
                style={{ transform: "scaleY(0)" }}
              />
            </div>
            <div className="text-xs text-(--foreground)/40 font-medium">
              Scroll
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
