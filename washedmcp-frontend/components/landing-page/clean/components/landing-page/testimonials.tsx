"use client"

import { useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Quote, Star, Play } from "lucide-react"
import config from "@/config/landing-page.json"

type Testimonial = {
  content: string
  highlight?: string
  rating?: number
  author: {
    name: string
    role: string
    company: string
    avatar?: string
  }
}

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: Testimonial
  index: number
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const rating = testimonial.rating ?? 5

  return (
    <motion.div
      ref={cardRef}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative flex min-w-[380px] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-accent/50 hover:shadow-2xl lg:p-8"
    >
      {/* Hover gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Highlight badge */}
      {testimonial.highlight && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
        >
          <Star className="h-3 w-3 fill-accent" />
          {testimonial.highlight}
        </motion.div>
      )}

      {/* Quote icon with animation */}
      <motion.div
        initial={{ rotate: 0, scale: 1 }}
        whileHover={{ rotate: 12, scale: 1.1 }}
        className="absolute right-6 top-6"
      >
        <Quote className="h-10 w-10 text-accent/10 transition-colors group-hover:text-accent/20" />
      </motion.div>

      {/* Star rating */}
      <div className="mb-4 flex gap-1">
        {[...Array(rating)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, type: "spring" }}
          >
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          </motion.div>
        ))}
      </div>

      <blockquote className="relative z-10 flex-1 text-foreground leading-relaxed">"{testimonial.content}"</blockquote>

      <div className="relative z-10 mt-6 flex items-center gap-4 border-t border-border pt-6">
        <motion.div whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }}>
          <Avatar className="h-12 w-12 ring-2 ring-transparent transition-all group-hover:ring-accent/30">
            <AvatarImage src={testimonial.author.avatar || "/placeholder-user.jpg"} alt={testimonial.author.name} />
            <AvatarFallback className="bg-gradient-to-br from-accent to-accent/60 text-accent-foreground font-semibold">
              {testimonial.author.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
        </motion.div>
        <div>
          <p className="font-semibold text-foreground">{testimonial.author.name}</p>
          <p className="text-sm text-muted-foreground">
            {testimonial.author.role}, {testimonial.author.company}
          </p>
        </div>
      </div>

      {/* Bottom accent line */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        className="absolute bottom-0 left-0 h-1 w-full origin-left bg-gradient-to-r from-accent to-accent/50"
      />
    </motion.div>
  )
}

export function Testimonials() {
  const [isPaused, setIsPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  const testimonialsConfig = config.sections.testimonials
  const testimonials = (testimonialsConfig?.testimonials || []) as Testimonial[]

  if (!testimonialsConfig?.enabled || testimonials.length === 0) return null

  const duplicatedTestimonials = [...testimonials, ...testimonials, ...testimonials]

  return (
    <section ref={sectionRef} id="testimonials" className="relative overflow-hidden bg-muted/30 py-24 sm:py-32">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-full w-32 bg-gradient-to-r from-muted/30 to-transparent" />
        <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-muted/30 to-transparent" />
        {/* Subtle pattern */}
        <div
          className="absolute inset-0 opacity-[0.01]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-sm font-semibold uppercase tracking-wide text-accent"
          >
            Testimonials
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            {testimonialsConfig.heading}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            {testimonialsConfig.description}
          </motion.p>
        </div>
      </div>

      {/* Marquee container */}
      <div
        ref={containerRef}
        className="relative mt-16"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* First row - moves left */}
        <motion.div
          animate={{ x: isPaused ? 0 : [0, -2280] }}
          transition={{
            x: {
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "loop",
              duration: 50,
              ease: "linear",
            },
          }}
          className="mb-6 flex gap-6 px-6"
        >
          {duplicatedTestimonials.map((testimonial, index) => (
            <TestimonialCard
              key={`row1-${testimonial.author.name}-${index}`}
              testimonial={testimonial}
              index={index % testimonials.length}
            />
          ))}
        </motion.div>

        {/* Second row - moves right */}
        <motion.div
          animate={{ x: isPaused ? 0 : [-2280, 0] }}
          transition={{
            x: {
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "loop",
              duration: 55,
              ease: "linear",
            },
          }}
          className="flex gap-6 px-6"
        >
          {[...duplicatedTestimonials].reverse().map((testimonial, index) => (
            <TestimonialCard
              key={`row2-${testimonial.author.name}-${index}`}
              testimonial={testimonial}
              index={index % testimonials.length}
            />
          ))}
        </motion.div>
      </div>

      {/* Pause indicator */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: isPaused ? 1 : 0 }} className="mt-8 flex justify-center">
        <div className="flex items-center gap-2 rounded-full bg-card/80 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
          <Play className="h-3 w-3" />
          Hover to pause
        </div>
      </motion.div>
    </section>
  )
}
