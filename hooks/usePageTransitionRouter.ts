'use client';

import { useTransitionContext } from '@/components/transition/PageTransitionProvider';

/**
 * Programmatic navigation hook that plays the page-transition animation before
 * the route change.
 *
 * Usage:
 *   const { push } = usePageTransitionRouter();
 *   push('/store');
 */
export function usePageTransitionRouter() {
  const { triggerTransition } = useTransitionContext();
  return { push: triggerTransition };
}
