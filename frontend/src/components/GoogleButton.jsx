import React from 'react';
import { Loader2 } from 'lucide-react';

export const GoogleGIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" className="shrink-0">
    <path
      fill="#EA4335"
      d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.8 7.3l3.7 2.9C6.4 7.2 8.9 5 12 5z"
    />
    <path
      fill="#4285F4"
      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"
    />
    <path
      fill="#FBBC05"
      d="M5.5 14.8c-.2-.7-.4-1.5-.4-2.8 0-1.2.2-2 .4-2.8L1.8 6.3C.7 8.5 0 10.7 0 12s.7 3.5 1.8 5.7l3.7-2.9z"
    />
    <path
      fill="#34A853"
      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.6-2.2-6.5-5.2L1.8 16C3.7 20.4 7.5 23 12 23z"
    />
  </svg>
);

/**
 * GoogleButton component.
 * Style requirements:
 * - Transparent dark background
 * - Thin cyan/teal border
 * - Google icon on the left
 * - Compact height
 * - Smooth hover effect & focus outline
 */
export const GoogleButton = ({
  onClick,
  disabled = false,
  loading = false,
  text = 'Continue with Google',
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm text-slate-200
        bg-[#111723]/80 hover:bg-[#162032] active:bg-[#0c121e]
        border border-[#00E5D9]/40 hover:border-[#00E5D9]
        transition-all duration-200 ease-out
        flex items-center justify-center gap-3
        cursor-pointer select-none
        hover:shadow-sm hover:shadow-[#00E5D9]/15
        disabled:opacity-60 disabled:cursor-not-allowed
        focus:outline-none focus:ring-1 focus:ring-[#00E5D9]/50
        ${className}
      `}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-[#00E5D9]" />
      ) : (
        <GoogleGIcon />
      )}
      <span className="truncate">{text}</span>
    </button>
  );
};

export default GoogleButton;
