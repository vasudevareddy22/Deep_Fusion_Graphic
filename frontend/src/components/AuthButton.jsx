import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable AuthButton component.
 * Style requirements:
 * - Full width
 * - Bright cyan/turquoise background (#00E5D9 / #0B9F9C vibe)
 * - Dark text (#0a0f1d)
 * - Compact height with slight rounded corners
 * - Smooth transition & hover elevation/glow
 * - Accessible loading and disabled states
 */
export const AuthButton = ({
  children,
  onClick,
  type = 'submit',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`w-full py-2.5 px-4 rounded-lg font-bold text-sm tracking-wide text-[#07131b]
        bg-[#00E5D9] hover:bg-[#1ff0e4] active:bg-[#00c9bd]
        transition-all duration-200 ease-out
        flex items-center justify-center gap-2
        shadow-sm hover:shadow-md hover:shadow-[#00E5D9]/25 hover:-translate-y-0.5 active:translate-y-0
        disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none
        cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#00E5D9]/50
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-[#07131b]" />
          <span>Processing…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default AuthButton;
