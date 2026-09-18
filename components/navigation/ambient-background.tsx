"use client";
import React from "react";

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* Top primary ambient glow */}
      <div 
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[140px] opacity-40 dark:opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(168, 85, 247, 0.2) 50%, transparent 80%)"
        }}
      />
      {/* Left subtle emerald sports highlight */}
      <div 
        className="absolute top-1/3 -left-48 w-[500px] h-[500px] rounded-full blur-[130px] opacity-25 dark:opacity-15"
        style={{
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(6, 182, 212, 0.15) 50%, transparent 80%)"
        }}
      />
      {/* Right subtle warm amber highlight */}
      <div 
        className="absolute top-2/3 -right-48 w-[550px] h-[550px] rounded-full blur-[150px] opacity-25 dark:opacity-15"
        style={{
          background: "radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, rgba(239, 68, 68, 0.1) 60%, transparent 80%)"
        }}
      />
      {/* Subtle fine noise overlay texture */}
      <div 
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
}
