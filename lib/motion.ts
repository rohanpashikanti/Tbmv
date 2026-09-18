import { Transition, Variants } from "framer-motion";

export const springSmooth: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 30,
  mass: 0.8,
};

export const springGentle: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 24,
  mass: 1,
};

export const springTactile: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 28,
  mass: 0.6,
};

export const springBouncy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 18,
  mass: 0.8,
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springSmooth,
  },
};

export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springGentle,
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};
