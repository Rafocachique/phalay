'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const glassCardVariants = cva(
  'rounded-3xl border transition-all duration-300',
  {
    variants: {
      variant: {
        default:
          'bg-white/70 backdrop-blur-xl border-white/40 shadow-glass',
        solid:
          'bg-white border-gray-100 shadow-soft',
        frosted:
          'bg-white/40 backdrop-blur-2xl border-white/30 shadow-glass-lg',
        elevated:
          'bg-white border-gray-100 shadow-soft-lg hover:shadow-premium',
        gradient:
          'bg-gradient-glass backdrop-blur-xl border-white/50 shadow-glass',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
      hover: {
        true: 'hover:shadow-premium hover:-translate-y-1 cursor-pointer',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
      hover: false,
    },
  },
);

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, padding, hover, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(glassCardVariants({ variant, padding, hover, className }))}
        {...props}
      />
    );
  },
);

GlassCard.displayName = 'GlassCard';

export { GlassCard, glassCardVariants };
