import React from 'react';
import { Shield } from 'lucide-react';

/**
 * BrandPanel component (Left Side of Card).
 * Requirements:
 * - Visually dominant but minimal promotional panel
 * - Dark teal/turquoise gradient with subtle blurred/wavy abstract texture
 * - Top-left small text: "Welcome"
 * - Main heading around vertical center: "Your journey starts here." (2-3 lines, large bold white typography with tight line spacing)
 * - Bottom-left small white pill/badge: "Your Brand" (or customizable brand badge)
 * - Clean responsive behavior (compact banner on mobile, dominant 50% split on desktop)
 */
export const BrandPanel = ({
  welcomeText = 'Welcome',
  heading = 'Your journey starts here.',
  brandName = 'DeepFusionGuard',
}) => {
  return (
    <div className="relative overflow-hidden flex flex-col justify-between p-8 sm:p-10 lg:p-12 text-white min-h-[220px] md:min-full bg-gradient-to-br from-[#0B1528] via-[#0F1E3D] to-[#060D1A]">
      {/* ── Subtle abstract wavy/blurred gradient textures ── */}
      <div className="absolute inset-0 pointer-events-none opacity-50 mix-blend-screen">
        {/* Glow 1: Cyan orb */}
        <div className="absolute -top-16 -left-16 w-80 h-80 rounded-full bg-[#06B6D4] blur-[90px] opacity-40 animate-pulse" />
        {/* Glow 2: Deep blue orb */}
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-[#2563EB] blur-[110px] opacity-45" />
        {/* Glow 3: Center soft light */}
        <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-[#3B82F6] blur-[120px] opacity-30" />
      </div>

      {/* Subtle geometric line texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(59,130,246,0.8) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* ── Top-Left: Welcome text ── */}
      <div className="relative z-10">
        <span className="text-xs sm:text-sm font-semibold tracking-wider text-cyan-300 font-mono uppercase select-none flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          {welcomeText}
        </span>
      </div>

      {/* ── Center: Main Heading ── */}
      <div className="relative z-10 my-auto py-6 md:py-0">
        <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-white leading-[1.1] max-w-sm">
          {heading}
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-3 max-w-xs font-normal leading-relaxed">
          AI-driven multi-modal threat defense &amp; unified security operations.
        </p>
      </div>

      {/* ── Bottom-Left: Pill badge ── */}
      <div className="relative z-10 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D182E] border border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-950/40 select-none font-mono">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-bold tracking-tight">{brandName}</span>
        </div>
      </div>
    </div>
  );
};

export default BrandPanel;
