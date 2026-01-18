'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Props for Skeleton component
 */
export interface SkeletonProps {
  /**
   * Width of the skeleton (CSS value)
   * @default '100%'
   */
  width?: string | number;

  /**
   * Height of the skeleton (CSS value)
   * @default '20px'
   */
  height?: string | number;

  /**
   * Border radius (CSS value)
   * @default '6px'
   */
  radius?: string | number;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Shape variant
   * @default 'rectangle'
   */
  variant?: 'rectangle' | 'circle' | 'text';

  /**
   * Animation speed
   * @default 1.5
   */
  animationSpeed?: number;

  /**
   * Disable animation
   * @default false
   */
  noAnimation?: boolean;
}

/**
 * Skeleton Component
 * Base loading skeleton with shimmer effect
 * Matches Clean design system with 6px border radius and smooth animations
 *
 * @example
 * ```tsx
 * // Rectangle skeleton
 * <Skeleton width="200px" height="40px" />
 *
 * // Circle skeleton (avatar)
 * <Skeleton variant="circle" width="48px" height="48px" />
 *
 * // Text skeleton
 * <Skeleton variant="text" width="150px" />
 * ```
 */
export function Skeleton({
  width = '100%',
  height = '20px',
  radius = '6px',
  className,
  variant = 'rectangle',
  animationSpeed = 1.5,
  noAnimation = false,
}: SkeletonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full';
      case 'text':
        return 'rounded-[6px]';
      case 'rectangle':
      default:
        return 'rounded-[6px]';
    }
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: variant === 'circle' ? '50%' : typeof radius === 'number' ? `${radius}px` : radius,
  };

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden bg-gradient-to-r from-(--color-border) via-(--color-background) to-(--color-border)',
        'bg-[length:200%_100%]',
        getVariantStyles(),
        className
      )}
      style={style}
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        backgroundPosition: noAnimation ? '0% 0%' : ['0% 0%', '100% 0%'],
      }}
      transition={{
        opacity: { duration: 0.2 },
        backgroundPosition: noAnimation
          ? { duration: 0 }
          : {
              duration: animationSpeed,
              ease: 'linear',
              repeat: Infinity,
            },
      }}
      aria-label="Loading..."
      role="status"
    />
  );
}

/**
 * Skeleton Group Component
 * Container for multiple skeleton elements with staggered animation
 *
 * @example
 * ```tsx
 * <SkeletonGroup>
 *   <Skeleton width="100%" height="40px" />
 *   <Skeleton width="80%" height="40px" />
 *   <Skeleton width="90%" height="40px" />
 * </SkeletonGroup>
 * ```
 */
export function SkeletonGroup({
  children,
  className,
  stagger = 0.05,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      className={cn('space-y-3', className)}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: stagger,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Skeleton Text Component
 * Pre-configured skeleton for text content with multiple lines
 *
 * @example
 * ```tsx
 * <SkeletonText lines={3} />
 * ```
 */
export function SkeletonText({
  lines = 1,
  className,
  lastLineWidth = '70%',
}: {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}) {
  return (
    <SkeletonGroup className={className}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          height="16px"
          width={index === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </SkeletonGroup>
  );
}
