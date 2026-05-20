"use client";

import { MotionConfig, motion } from "framer-motion";
import type { ReactNode } from "react";

type AuthCardMotionProps = {
  children: ReactNode;
  className?: string;
};

export function AuthCardMotion({ children, className = "" }: AuthCardMotionProps) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className={`auth-card motion-safe-transition ${className}`}
      >
        {children}
      </motion.article>
    </MotionConfig>
  );
}
