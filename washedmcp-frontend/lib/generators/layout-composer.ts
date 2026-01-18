/**
 * Layout Composer
 *
 * Composes dynamic page layouts by ordering sections based on layout strategy.
 * Handles section visibility, ordering, and spacing configurations.
 */

import type { LayoutId, SectionKey } from "@/config/landing-page.schema"
import designSystem from "@/config/design-system.json"

export interface LayoutComposition {
  id: LayoutId
  name: string
  description: string
  sectionOrder: SectionKey[]
  spacing: {
    section: string // Tailwind spacing class
    container: string // Max-width class
  }
  flow: "linear" | "alternating" | "dynamic"
}

export interface SectionConfig {
  key: SectionKey
  enabled: boolean
  order: number
  priority: "critical" | "high" | "medium" | "low"
}

/**
 * Get layout composition by ID
 */
export function getLayoutComposition(layoutId: LayoutId): LayoutComposition | null {
  const layout = designSystem.layouts.find(l => l.id === layoutId)
  if (!layout) return null

  return {
    id: layoutId,
    name: layout.name,
    description: layout.description,
    sectionOrder: layout.sectionOrder as SectionKey[],
    spacing: getLayoutSpacing(layoutId),
    flow: getLayoutFlow(layoutId)
  }
}

/**
 * Get all available layouts
 */
export function getAllLayouts(): LayoutId[] {
  return designSystem.layouts.map(layout => layout.id) as LayoutId[]
}

/**
 * Get recommended layouts for a theme
 */
export function getRecommendedLayouts(theme: string): LayoutId[] {
  return designSystem.layouts
    .filter(layout => layout.themes.includes(theme))
    .map(layout => layout.id) as LayoutId[]
}

/**
 * Compose section order from layout
 */
export function composeSectionOrder(
  layoutId: LayoutId,
  enabledSections?: Partial<Record<SectionKey, boolean>>
): SectionKey[] {
  const composition = getLayoutComposition(layoutId)
  if (!composition) return getDefaultSectionOrder()

  if (!enabledSections) {
    return composition.sectionOrder
  }

  // Filter out disabled sections
  return composition.sectionOrder.filter(section => {
    return enabledSections[section] !== false
  })
}

/**
 * Get default section order (standard layout)
 */
function getDefaultSectionOrder(): SectionKey[] {
  const standardLayout = designSystem.layouts.find(l => l.id === "standard")
  return standardLayout?.sectionOrder as SectionKey[] || []
}

/**
 * Get layout spacing configuration
 */
function getLayoutSpacing(layoutId: LayoutId): {
  section: string
  container: string
} {
  const spacingMap: Record<LayoutId, { section: string; container: string }> = {
    standard: {
      section: "py-20 lg:py-32",
      container: "max-w-7xl"
    },
    asymmetric: {
      section: "py-16 lg:py-28",
      container: "max-w-screen-2xl"
    },
    minimal: {
      section: "py-24 lg:py-40",
      container: "max-w-6xl"
    },
    feature_heavy: {
      section: "py-16 lg:py-24",
      container: "max-w-7xl"
    },
    social_proof: {
      section: "py-20 lg:py-32",
      container: "max-w-7xl"
    }
  }

  return spacingMap[layoutId] || spacingMap.standard
}

/**
 * Get layout flow type
 */
function getLayoutFlow(layoutId: LayoutId): "linear" | "alternating" | "dynamic" {
  const flowMap: Record<LayoutId, "linear" | "alternating" | "dynamic"> = {
    standard: "linear",
    asymmetric: "alternating",
    minimal: "linear",
    feature_heavy: "dynamic",
    social_proof: "linear"
  }

  return flowMap[layoutId] || "linear"
}

/**
 * Generate section configurations with priority
 */
export function generateSectionConfigs(
  layoutId: LayoutId,
  enabledSections: Partial<Record<SectionKey, boolean>> = {}
): SectionConfig[] {
  const composition = getLayoutComposition(layoutId)
  if (!composition) return []

  return composition.sectionOrder.map((section, index) => ({
    key: section,
    enabled: enabledSections[section] !== false,
    order: index,
    priority: getSectionPriority(section, index)
  }))
}

/**
 * Determine section priority
 */
function getSectionPriority(
  section: SectionKey,
  order: number
): "critical" | "high" | "medium" | "low" {
  // Critical sections (always top priority)
  if (section === "hero" || section === "cta" || section === "footer") {
    return "critical"
  }

  // High priority (early sections)
  if (order < 3) {
    return "high"
  }

  // Medium priority (middle sections)
  if (order < 6) {
    return "medium"
  }

  // Low priority (later sections)
  return "low"
}

/**
 * Validate section order
 */
export function validateSectionOrder(sections: SectionKey[]): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Hero should be first (if present)
  if (sections.includes("hero") && sections[0] !== "hero") {
    errors.push("Hero section should be first")
  }

  // Footer should be last (if present)
  if (sections.includes("footer") && sections[sections.length - 1] !== "footer") {
    errors.push("Footer section should be last")
  }

  // CTA should be near the end
  const ctaIndex = sections.indexOf("cta")
  if (ctaIndex !== -1 && ctaIndex < sections.length - 3) {
    warnings.push("CTA section is typically more effective near the end")
  }

  // Check for duplicates
  const duplicates = sections.filter((section, index) => sections.indexOf(section) !== index)
  if (duplicates.length > 0) {
    errors.push(`Duplicate sections found: ${duplicates.join(", ")}`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Optimize section order for conversion
 */
export function optimizeSectionOrder(
  sections: SectionKey[],
  goal: "conversion" | "engagement" | "information"
): SectionKey[] {
  const optimized = [...sections]

  if (goal === "conversion") {
    // Move pricing and CTA closer to testimonials
    const testimonialIndex = optimized.indexOf("testimonials")
    const pricingIndex = optimized.indexOf("pricing")

    if (testimonialIndex !== -1 && pricingIndex !== -1 && pricingIndex < testimonialIndex) {
      // Move pricing after testimonials
      optimized.splice(pricingIndex, 1)
      optimized.splice(testimonialIndex, 0, "pricing")
    }
  } else if (goal === "engagement") {
    // Move interactive sections earlier
    const bentoIndex = optimized.indexOf("bentoFeatures")
    if (bentoIndex > 3) {
      optimized.splice(bentoIndex, 1)
      optimized.splice(2, 0, "bentoFeatures")
    }
  } else if (goal === "information") {
    // Move feature sections earlier
    const stackingIndex = optimized.indexOf("stackingFeatures")
    if (stackingIndex > 4) {
      optimized.splice(stackingIndex, 1)
      optimized.splice(3, 0, "stackingFeatures")
    }
  }

  return optimized
}

/**
 * Compare two layouts
 */
export function compareLayouts(
  layoutA: LayoutId,
  layoutB: LayoutId
): {
  sectionsDifference: number
  orderSimilarity: number
  recommendation: string
} {
  const compA = getLayoutComposition(layoutA)
  const compB = getLayoutComposition(layoutB)

  if (!compA || !compB) {
    return {
      sectionsDifference: 0,
      orderSimilarity: 0,
      recommendation: "Invalid layout(s)"
    }
  }

  // Calculate sections difference
  const uniqueSections = new Set([...compA.sectionOrder, ...compB.sectionOrder])
  const commonSections = compA.sectionOrder.filter(s => compB.sectionOrder.includes(s))
  const sectionsDifference = 1 - (commonSections.length / uniqueSections.size)

  // Calculate order similarity (how many sections are in same position)
  let samePositionCount = 0
  for (let i = 0; i < Math.min(compA.sectionOrder.length, compB.sectionOrder.length); i++) {
    if (compA.sectionOrder[i] === compB.sectionOrder[i]) {
      samePositionCount++
    }
  }
  const orderSimilarity = samePositionCount / Math.max(compA.sectionOrder.length, compB.sectionOrder.length)

  let recommendation = ""
  if (sectionsDifference > 0.3) {
    recommendation = `Layouts have significantly different sections`
  } else if (orderSimilarity < 0.3) {
    recommendation = `Layouts have very different section ordering`
  } else {
    recommendation = `Layouts are relatively similar`
  }

  return {
    sectionsDifference,
    orderSimilarity,
    recommendation
  }
}

/**
 * Get layout diversity score for a set of layouts
 */
export function calculateLayoutDiversity(layouts: LayoutId[]): number {
  if (layouts.length === 0) return 0

  const uniqueLayouts = new Set(layouts)
  return uniqueLayouts.size / layouts.length
}

/**
 * Suggest complementary layouts
 */
export function suggestComplementaryLayouts(
  primaryLayout: LayoutId,
  count: number = 2
): LayoutId[] {
  const allLayouts = getAllLayouts()
  const scored = allLayouts
    .filter(l => l !== primaryLayout)
    .map(layout => {
      const comparison = compareLayouts(primaryLayout, layout)
      // Higher score for more different layouts
      const score = comparison.sectionsDifference + (1 - comparison.orderSimilarity)
      return { layout, score }
    })
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, count).map(item => item.layout)
}

/**
 * Get section count for layout
 */
export function getSectionCount(layoutId: LayoutId): number {
  const composition = getLayoutComposition(layoutId)
  return composition?.sectionOrder.length || 0
}

/**
 * Check if layout includes section
 */
export function layoutIncludesSection(
  layoutId: LayoutId,
  section: SectionKey
): boolean {
  const composition = getLayoutComposition(layoutId)
  return composition?.sectionOrder.includes(section) || false
}
