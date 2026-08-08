'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-primary-400 via-primary-500 to-accent-400 text-white shadow-premium hover:shadow-premium-lg hover:brightness-110',
        secondary:
          'bg-background-muted text-foreground hover:bg-primary-50 hover:text-primary-600 border border-transparent hover:border-primary-200',
        outline:
          'border-2 border-primary-300 bg-transparent text-primary-600 hover:bg-primary-50 hover:border-primary-500',
        ghost:
          'text-foreground-muted hover:bg-background-muted hover:text-foreground',
        danger:
          'bg-danger text-white hover:bg-danger/90 shadow-sm',
        glass:
          'backdrop-blur-xl bg-white/30 border border-white/40 text-foreground shadow-glass hover:bg-white/50 hover:shadow-glass-lg',
        link: 'text-primary-500 underline-offset-4 hover:underline hover:text-primary-600 p-0 h-auto',
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        default: 'h-11 px-6 text-sm',
        lg: 'h-13 px-8 text-base',
        xl: 'h-14 px-10 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Cargando...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button, buttonVariants };
