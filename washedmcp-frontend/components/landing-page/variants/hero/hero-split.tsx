"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, Check, Play } from "lucide-react"
import Link from "next/link"
import { useRef, useMemo } from "react"
import { GraphCanvas, lightTheme } from "reagraph"
import type { Theme } from "reagraph"
import config from "@/config/landing-page.json"

const mcpColors = ['#0EA5E9', '#06B6D4', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981']

export function HeroSplit() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  const x = useTransform(scrollYProgress, [0, 0.5], [0, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const hero = config.sections.hero

  // Handle headline structure (object with prefix/rotating/suffix or simple string)
  const getHeadlineParts = () => {
    if (typeof hero.headline === 'object' && hero.headline !== null && 'prefix' in hero.headline) {
      return {
        prefix: hero.headline.prefix || '',
        rotating: hero.headline.rotating?.[0] || '',
        suffix: hero.headline.suffix || ''
      }
    }
    return { prefix: String(hero.headline || ''), rotating: '', suffix: '' }
  }

  const { prefix, rotating, suffix } = getHeadlineParts()

  // EXACT dashboard graph configuration
  const mockMCPs = useMemo(() => [
    { id: 'mcp-1', name: 'GitHub', status: 'active', contextCount: 24 },
    { id: 'mcp-2', name: 'Slack', status: 'active', contextCount: 18 },
    { id: 'mcp-3', name: 'Notion', status: 'active', contextCount: 31 },
    { id: 'mcp-4', name: 'Drive', status: 'active', contextCount: 15 },
    { id: 'mcp-5', name: 'Jira', status: 'active', contextCount: 22 },
  ], [])

  const graphTheme: Theme = useMemo(() => ({
    ...lightTheme,
    canvas: {
      background: 'transparent',
      fog: 'transparent',
    },
    node: {
      fill: '#0EA5E9',
      activeFill: '#0284C7',
      opacity: 1,
      selectedOpacity: 1,
      inactiveOpacity: 0.2,
      label: {
        color: '#1E293B',
        stroke: '#FFFFFF',
        activeColor: '#0EA5E9',
        fontFamily: 'Playfair Display, serif',
        fontSize: 12,
      },
      subLabel: {
        color: '#64748B',
        stroke: '#FFFFFF',
        activeColor: '#64748B',
        fontFamily: 'Playfair Display, serif',
        fontSize: 10,
      },
    },
    edge: {
      fill: '#38BDF8',
      activeFill: '#0EA5E9',
      opacity: 0.3,
      selectedOpacity: 1,
      inactiveOpacity: 0.1,
      label: {
        stroke: '#FFFFFF',
        color: '#64748B',
        activeColor: '#0EA5E9',
        fontFamily: 'Playfair Display, serif',
        fontSize: 10,
      },
    },
    arrow: {
      fill: '#38BDF8',
      activeFill: '#0EA5E9',
    },
    cluster: {
      stroke: '#E5EAEF',
      opacity: 0.1,
      selectedOpacity: 0.2,
      inactiveOpacity: 0.05,
      label: {
        stroke: '#FFFFFF',
        color: '#64748B',
        activeColor: '#0EA5E9',
        fontFamily: 'Playfair Display, serif',
      },
    },
    ring: {
      fill: '#0EA5E9',
      activeFill: '#0284C7',
    },
  }), [])

  const nodes = useMemo(() => [
    {
      id: 'clean',
      label: 'Clean',
      fill: '#0EA5E9',
      size: 8,
    },
    ...mockMCPs.map((mcp, index) => ({
      id: mcp.id,
      label: mcp.name,
      fill: mcpColors[index % mcpColors.length],
      size: 6,
    })),
  ], [mockMCPs])

  const edges = useMemo(() =>
    mockMCPs.map((mcp) => ({
      id: `clean-${mcp.id}`,
      source: 'clean',
      target: mcp.id,
      fill: '#06B6D4',
    }))
  , [mockMCPs])

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-(--background) via-(--accent)/5 to-(--background)" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <motion.div style={{ x, opacity }}>
            {/* Badge */}
            {hero.announcement && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-(--accent)/10 border border-(--accent)/20 mb-6"
              >
                <span className="text-sm font-medium text-(--accent)">
                  {hero.announcement.text}
                </span>
              </motion.div>
            )}

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            >
              <span className="block text-[#1E293B]">{prefix}</span>
              <span className="block text-[#0EA5E9]">
                {rotating}
              </span>
              {suffix && <span className="block text-[#1E293B]">{suffix}</span>}
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-(--foreground)/70 mb-8 leading-relaxed max-w-xl"
            >
              {hero.subheadline}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 mb-8"
            >
              <Link href={hero.cta.primary.link}>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 50px oklch(0.65 0.2 160 / 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  className="group px-8 py-4 bg-(--accent) text-(--background) rounded-lg font-semibold flex items-center gap-2 shadow-glow transition-all"
                >
                  {hero.cta.primary.text}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              {hero.cta.secondary && (
                <Link href={hero.cta.secondary.link}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group px-8 py-4 bg-transparent backdrop-blur-sm rounded-lg font-semibold border border-(--foreground)/10 hover:border-(--accent)/30 transition-all flex items-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    {hero.cta.secondary.text}
                  </motion.button>
                </Link>
              )}
            </motion.div>

            {/* Social Proof */}
            {hero.socialProof && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-wrap items-center gap-6"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-(--accent)" />
                  <span className="text-sm text-(--foreground)/70">
                    {hero.socialProof.count} {hero.socialProof.text}
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Right: Visual - EXACT Dashboard Graph */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-square lg:aspect-[4/5]">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-(--accent)/5 to-(--accent)/2 backdrop-blur-sm border border-(--accent)/20 shadow-2xl overflow-hidden">
                <GraphCanvas
                  nodes={nodes}
                  edges={edges}
                  theme={graphTheme}
                  layoutType="forceDirected2d"
                  edgeArrowPosition="end"
                  edgeInterpolation="linear"
                  draggable={false}
                  labelType="all"
                  animated={false}
                  cameraMode="rotate"
                  sizingType="centrality"
                />
              </div>

              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-(--accent)/20 to-(--accent)/10 rounded-3xl blur-3xl opacity-50" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
