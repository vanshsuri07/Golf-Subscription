// lib/design-tokens.ts

export const DURATIONS = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
  pageTransition: 0.5,
} as const

export const EASINGS = {
  easeOut: [0.25, 1, 0.5, 1],
  easeIn: [0.4, 0, 1, 1],
  easeInOut: [0.25, 0.1, 0.25, 1],
  springSoft: { type: 'spring', stiffness: 300, damping: 24, mass: 0.5 },
  springBouncy: { type: 'spring', stiffness: 400, damping: 15 },
} as const

export const VARIANTS = {
  pageInitial: {
    opacity: 0,
    y: 10,
  },
  pageAnimate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATIONS.pageTransition,
      ease: EASINGS.easeOut,
    },
  },
  pageExit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.easeIn,
    },
  },
}

export const SPACING = {
  sectionPadding: 'py-16 md:py-24', // Standard vertical rhythm
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
}
