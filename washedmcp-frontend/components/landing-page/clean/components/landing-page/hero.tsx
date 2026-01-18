"use client"

import config from "@/config/landing-page.json"
import {
  HeroCentered,
  HeroSplit,
  HeroBold,
  HeroMinimal,
  HeroGlassmorphic,
} from "./variants/hero"

const HERO_VARIANTS = {
  "hero-centered": HeroCentered,
  "hero-split": HeroSplit,
  "hero-bold": HeroBold,
  "hero-minimal": HeroMinimal,
  "hero-glassmorphic": HeroGlassmorphic,
}

export function Hero() {
  const variant = config.designSystem?.components?.hero || "hero-centered"
  const Component = HERO_VARIANTS[variant as keyof typeof HERO_VARIANTS] || HeroCentered

  return <Component />
}
