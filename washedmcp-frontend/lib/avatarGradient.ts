// Design system gradient colors (matching CLAUDE.md)
const brandGradients: Array<[string, string]> = [
  ['#0EA5E9', '#06B6D4'], // Primary to Secondary
  ['#06B6D4', '#14B8A6'], // Secondary to Tertiary
  ['#8B5CF6', '#EC4899'], // Purple to Pink
  ['#EC4899', '#F59E0B'], // Pink to Warning
  ['#F59E0B', '#10B981'], // Warning to Success
  ['#10B981', '#0EA5E9'], // Success to Primary
];

/**
 * Get a deterministic gradient tuple based on user ID
 * Returns an array of two colors from the brand palette
 */
export function getAvatarGradientTuple(userId: string): [string, string] {
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const index = Math.abs(hash) % brandGradients.length;
  return brandGradients[index] as [string, string];
}

/**
 * Get a deterministic gradient CSS string based on user ID
 * Returns a CSS linear-gradient string using brand colors
 */
export function getAvatarGradient(userId: string): string {
  const [color1, color2] = getAvatarGradientTuple(userId);
  return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
}

/**
 * Get a random gradient from the brand palette (for testing/placeholders)
 */
export function getRandomGradient(): string {
  const randomIndex = Math.floor(Math.random() * brandGradients.length);
  const [color1, color2] = brandGradients[randomIndex];
  return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
}

/**
 * Get all available brand gradients
 */
export function getAllGradients(): Array<[string, string]> {
  return brandGradients;
}
