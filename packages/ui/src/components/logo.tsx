'use client';

import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
}

const sizeMap = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-6xl',
};

function Logo({ className, size = 'md', variant = 'full' }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Ícono del logo */}
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 via-primary-500 to-accent-400 shadow-premium',
          size === 'sm' && 'h-8 w-8',
          size === 'md' && 'h-10 w-10',
          size === 'lg' && 'h-14 w-14',
          size === 'xl' && 'h-20 w-20',
        )}
      >
        <span
          className={cn(
            'font-display font-bold text-white',
            size === 'sm' && 'text-sm',
            size === 'md' && 'text-lg',
            size === 'lg' && 'text-2xl',
            size === 'xl' && 'text-4xl',
          )}
        >
          P
        </span>
      </div>

      {/* Texto del logo */}
      {variant === 'full' && (
        <span
          className={cn(
            'font-display font-bold tracking-tight text-foreground',
            sizeMap[size],
          )}
        >
          PHALAY
        </span>
      )}
    </div>
  );
}

export { Logo };
