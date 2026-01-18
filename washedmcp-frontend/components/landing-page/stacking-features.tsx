"use client"

import config from "@/config/landing-page.json"
import {
  StackingScroll,
  StackingParallax,
  StackingMorph,
} from "./variants/stacking"

const STACKING_VARIANTS = {
  "stacking-scroll": StackingScroll,
  "stacking-parallax": StackingParallax,
  "stacking-morph": StackingMorph,
}

export function StackingFeatures() {
  const variant = config.designSystem?.components?.stacking || "stacking-scroll"
  const Component = STACKING_VARIANTS[variant as keyof typeof STACKING_VARIANTS] || StackingScroll

  return <Component />
}
