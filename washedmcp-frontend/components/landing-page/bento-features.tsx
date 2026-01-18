"use client"

import config from "@/config/landing-page.json"
import {
  Bento3D,
  BentoFlat,
  BentoCards,
  BentoMasonry,
} from "./variants/bento"

const BENTO_VARIANTS = {
  "bento-3d": Bento3D,
  "bento-flat": BentoFlat,
  "bento-cards": BentoCards,
  "bento-masonry": BentoMasonry,
}

export function BentoFeatures() {
  const variant = config.designSystem?.components?.bento || "bento-3d"
  const Component = BENTO_VARIANTS[variant as keyof typeof BENTO_VARIANTS] || Bento3D

  return <Component />
}
