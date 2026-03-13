import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Input = React.forwardRef(({ className, label, error, icon: Icon, ...props }, ref) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="text-sm font-semibold text-gray-700 ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-600 text-gray-400">
            <Icon size={18} />
          </div>
        )}
        <input
          ref={ref}
          className={twMerge(
            clsx(
              "flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white transition-all",
              "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
              "disabled:cursor-not-allowed disabled:opacity-50",
              Icon && "pl-11",
              error && "border-red-500 focus:ring-red-500/20 focus:border-red-500",
              className
            )
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs font-medium text-red-500 ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
