'use client';

import * as React from 'react';
import { cn } from '../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground-muted"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-light">
              {icon}
            </div>
          )}
          <input
            type={type}
            id={inputId}
            className={cn(
              'flex h-11 w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2 text-sm text-foreground backdrop-blur-sm transition-all duration-200',
              'placeholder:text-foreground-light',
              'focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200',
              'hover:border-primary-300',
              'disabled:cursor-not-allowed disabled:opacity-50',
              icon && 'pl-11',
              error && 'border-danger focus:border-danger focus:ring-danger/20',
              className,
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs font-medium text-danger">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input };
