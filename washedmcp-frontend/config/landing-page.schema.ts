/**
 * Landing Page Configuration Schema
 *
 * This schema defines the structure for configurable landing pages.
 * All components should accept configuration from this schema.
 */

// ============================================================================
// Brand & Metadata
// ============================================================================

export interface BrandConfig {
  name: string
  tagline: string
  logo?: string
  colors: {
    primary: string // OKLCH format
    accent: string // OKLCH format
    background: string // OKLCH format
  }
}

export interface MetadataConfig {
  title: string
  description: string
  keywords: string[]
  ogImage?: string
}

// ============================================================================
// Section Configurations
// ============================================================================

export interface HeroConfig {
  enabled: boolean
  announcement?: {
    text: string
    link?: string
    icon?: string // Icon name from lucide-react
  }
  headline: {
    prefix?: string // e.g., "Workflow"
    rotating?: string[] // e.g., ["Automation", "Innovation"]
    suffix?: string // e.g., "for Modern Teams"
  }
  subheadline: string
  cta: {
    primary: {
      text: string
      link: string
    }
    secondary?: {
      text: string
      link: string
    }
  }
  socialProof?: {
    avatars: number
    count: string
    text: string
  }
  image?: {
    src: string
    alt: string
  }
  style: "centered" | "split" | "minimal"
}

export interface StatsConfig {
  enabled: boolean
  heading: string
  description?: string
  stats: Array<{
    value: number
    suffix: string
    label: string
    icon: string // Icon name from lucide-react
    color: string // Tailwind gradient classes
  }>
}

export interface FeatureItem {
  title: string
  description: string
  icon: string // Icon name from lucide-react
  image?: string
}

export interface BentoFeaturesConfig {
  enabled: boolean
  heading: string
  description?: string
  features: Array<FeatureItem & {
    size: "small" | "medium" | "large"
  }>
}

export interface StackingFeaturesConfig {
  enabled: boolean
  heading: string
  description?: string
  features: Array<FeatureItem & {
    gradient: string // Tailwind gradient classes
  }>
}

export interface TestimonialItem {
  content: string
  author: {
    name: string
    role: string
    company: string
    avatar?: string
  }
  rating?: number
}

export interface TestimonialsConfig {
  enabled: boolean
  heading: string
  description?: string
  testimonials: TestimonialItem[]
}

export interface PricingTier {
  name: string
  price: number | null // null for custom pricing
  description: string
  features: string[]
  cta: string
  featured: boolean
  gradient: string // Tailwind gradient classes
}

export interface PricingConfig {
  enabled: boolean
  heading: string
  description?: string
  billingToggle: boolean
  annualDiscount?: number // percentage (e.g., 20 for 20% off)
  tiers: PricingTier[]
}

export interface CTAConfig {
  enabled: boolean
  badge?: string
  headline: string
  description: string
  cta: {
    primary: {
      text: string
      link: string
    }
    secondary?: {
      text: string
      link: string
    }
  }
  trustBadges?: string[]
  backgroundColor?: string // CSS color or Tailwind class
}

export interface FooterLink {
  text: string
  href: string
}

export interface FooterColumn {
  title: string
  links: FooterLink[]
}

export interface FooterConfig {
  enabled: boolean
  tagline?: string
  columns: FooterColumn[]
  social?: Array<{
    platform: string // e.g., "twitter", "github", "linkedin"
    url: string
  }>
  copyright?: string
}

export interface LogoCloudConfig {
  enabled: boolean
  heading?: string
  logos: Array<{
    name: string
    src: string
    alt: string
  }>
}

// ============================================================================
// Effects Configuration
// ============================================================================

export interface EffectsConfig {
  smoothScroll: boolean
  customCursor: boolean
  spotlight: boolean
  noise: boolean
  animations: {
    enabled: boolean
    reducedMotion: boolean // Respect user preferences
  }
}

// ============================================================================
// Design System Configuration
// ============================================================================

export interface MetaConfig {
  projectIdea: string
  theme: AestheticTheme
  variation: VariationId
  generationId: string
  timestamp: string // ISO-8601 format
}

export interface DesignSystemConfig {
  components: {
    hero: ComponentVariantId
    bento: ComponentVariantId
    stacking: ComponentVariantId
  }
  layout: LayoutId
  animations: AnimationProfileId
  effects: {
    particles: boolean
    glitch: boolean
    mesh: boolean
    glow: boolean
    blur: boolean
    noise: boolean
  }
}

export type AestheticTheme = "BOLD" | "CLEAN" | "PLAYFUL" | "TECHNICAL" | "LUXE"
export type VariationId = "v1" | "v2" | "v3" | "v4" | "v5"
export type ComponentVariantId =
  | "hero-centered" | "hero-split" | "hero-bold" | "hero-minimal" | "hero-glassmorphic"
  | "bento-3d" | "bento-flat" | "bento-cards" | "bento-masonry"
  | "stacking-scroll" | "stacking-parallax" | "stacking-morph"
export type LayoutId = "standard" | "asymmetric" | "minimal" | "feature_heavy" | "social_proof"
export type AnimationProfileId =
  | "smooth" | "bouncy" | "dramatic" | "mechanical" | "elegant"
  | "gentle" | "attention" | "explosive" | "glitch" | "parallax"

// ============================================================================
// Main Landing Page Configuration
// ============================================================================

export interface LandingPageConfig {
  // Generation Metadata
  meta: MetaConfig

  // Design System
  designSystem: DesignSystemConfig

  // Brand & Metadata
  brand: BrandConfig
  metadata: MetadataConfig

  // Section Configuration
  sections: {
    hero: HeroConfig
    logoCloud?: LogoCloudConfig
    stats?: StatsConfig
    bentoFeatures?: BentoFeaturesConfig
    stackingFeatures?: StackingFeaturesConfig
    testimonials?: TestimonialsConfig
    pricing?: PricingConfig
    cta: CTAConfig
    footer: FooterConfig
  }

  // Effects (optional)
  effects?: EffectsConfig
}

// ============================================================================
// Template Types
// ============================================================================

export type TemplateType =
  | "saas" // Software as a Service
  | "product" // Physical/Digital Product
  | "portfolio" // Personal Portfolio
  | "agency" // Agency/Services
  | "startup" // Startup/MVP
  | "waitlist" // Coming Soon/Waitlist
  | "community" // Community/Platform
  | "marketplace" // E-commerce/Marketplace

export interface TemplateConfig {
  name: string
  type: TemplateType
  description: string
  sections: Array<keyof LandingPageConfig["sections"]>
  defaultConfig: Partial<LandingPageConfig>
}

// ============================================================================
// Generator Input
// ============================================================================

export interface GeneratorInput {
  projectIdea: string
  templateType: TemplateType
  customizations?: {
    brand?: Partial<BrandConfig>
    colors?: Partial<BrandConfig["colors"]>
    effects?: Partial<EffectsConfig>
    sections?: Array<keyof LandingPageConfig["sections"]>
  }
}

// ============================================================================
// Helper Types
// ============================================================================

export type SectionKey = keyof LandingPageConfig["sections"]
export type EnabledSections = {
  [K in SectionKey]: LandingPageConfig["sections"][K] extends { enabled: boolean }
    ? LandingPageConfig["sections"][K]
    : LandingPageConfig["sections"][K]
}
