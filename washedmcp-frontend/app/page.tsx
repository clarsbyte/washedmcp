"use client"

import { Header } from "@/components/landing-page/header"
import { Hero } from "@/components/landing-page/hero"
import { LogoCloud } from "@/components/landing-page/logo-cloud"
import { Stats } from "@/components/landing-page/stats"
import { BentoFeatures } from "@/components/landing-page/bento-features"
import { StackingFeatures } from "@/components/landing-page/stacking-features"
import { Testimonials } from "@/components/landing-page/testimonials"
import { Pricing } from "@/components/landing-page/pricing"
import { CTA } from "@/components/landing-page/cta"
import { Footer } from "@/components/landing-page/footer"
import { SmoothScroll } from "@/components/landing-page/smooth-scroll"
import { CustomCursor } from "@/components/landing-page/custom-cursor"
import { SpotlightProvider } from "@/components/landing-page/spotlight-provider"
import { NoiseOverlay } from "@/components/landing-page/noise-overlay"
import config from "@/config/landing-page.json"
import { composeSectionOrder } from "@/lib/generators/layout-composer"
import type { LayoutId } from "@/config/landing-page.schema"

// Section component registry
const SECTION_COMPONENTS = {
  hero: Hero,
  logoCloud: LogoCloud,
  stats: Stats,
  bentoFeatures: BentoFeatures,
  stackingFeatures: StackingFeatures,
  testimonials: Testimonials,
  pricing: Pricing,
  cta: CTA,
} as const

export default function Home() {
  // Get dynamic section order based on layout
  const layoutId = (config.designSystem?.layout || "standard") as LayoutId
  const sectionOrder = composeSectionOrder(layoutId)

  return (
    <SmoothScroll>
      <SpotlightProvider>
        <CustomCursor />
        <NoiseOverlay />
        <main className="min-h-screen landing-page">
          <Header />
          {sectionOrder.map((sectionId) => {
            const Component = SECTION_COMPONENTS[sectionId as keyof typeof SECTION_COMPONENTS]
            return Component ? <Component key={sectionId} /> : null
          })}
          <Footer />
        </main>
      </SpotlightProvider>
    </SmoothScroll>
  )
}
