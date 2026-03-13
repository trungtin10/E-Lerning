import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

const Button = React.forwardRef(({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm active:scale-[0.98]',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 active:scale-[0.98]',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 active:scale-[0.98]',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm active:scale-[0.98]',
  };

  const sizes = {
    sm: 'h-9 px-3 text-xs',
    md: 'h-11 px-6 text-sm',
    lg: 'h-12 px-8 text-base',
  };

  return (
    <button
      ref={ref}
      disabled={isLoading || props.disabled}
      className={twMerge(
        clsx(
          "inline-flex items-center justify-center rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 disabled:opacity-70 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        )
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : null}
      {children}
    </button>
  );
});

Button.displayName = "Button";

export default Button;
