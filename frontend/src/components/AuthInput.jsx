import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Reusable AuthInput component.
 * Follows design requirements:
 * - Compact uppercase/small label
 * - Dark gray background with subtle borders
 * - Left icon support
 * - Password visibility toggle with accessible aria-label
 * - Inline error message display
 */
export const AuthInput = ({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon: Icon,
  error,
  autoComplete,
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase select-none"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-slate-500 pointer-events-none flex items-center justify-center">
            <Icon className="w-4 h-4 text-slate-400" />
          </div>
        )}

        <input
          id={id}
          type={effectiveType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full bg-[#161c28] border rounded-lg text-slate-100 placeholder:text-slate-500 text-sm font-normal py-2.5 transition-all duration-200 outline-none
            ${Icon ? 'pl-9' : 'pl-3.5'}
            ${isPassword ? 'pr-10' : 'pr-3.5'}
            ${
              error
                ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                : 'border-slate-800 focus:border-[#00E5D9] focus:ring-1 focus:ring-[#00E5D9]/30 hover:border-slate-700'
            }
            ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
          `}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 text-slate-400 hover:text-slate-200 focus:outline-none transition-colors p-1 rounded cursor-pointer"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 text-slate-400" />
            ) : (
              <Eye className="w-4 h-4 text-slate-400" />
            )}
          </button>
        )}
      </div>

      {error && (
        <p id={`${id}-error`} className="text-xs text-rose-400 mt-0.5 font-medium flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
};

export default AuthInput;
