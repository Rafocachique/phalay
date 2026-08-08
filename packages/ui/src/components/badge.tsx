'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary-100 text-primary-700',
        success: 'bg-success-light text-green-700',
        warning: 'bg-warning-light text-amber-700',
        danger: 'bg-danger-light text-red-700',
        info: 'bg-info-light text-blue-700',
        outline: 'border border-primary-300 text-primary-600',
        glass: 'backdrop-blur-sm bg-white/50 border border-white/40 text-foreground-muted',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
