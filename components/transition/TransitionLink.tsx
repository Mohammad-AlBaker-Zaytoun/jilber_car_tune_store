'use client';

/**
 * TransitionLink — a semantic drop-in replacement for next/link that signals
 * "this navigation should play a page-transition animation."
 *
 * The animation itself is handled by the global click interceptor inside
 * PageTransitionProvider, so this component is a thin pass-through wrapper.
 * Its value is documentation + explicit opt-in at the call site.
 *
 * Usage:
 *   <TransitionLink href="/store">Store</TransitionLink>
 */

import Link, { type LinkProps } from 'next/link';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type TransitionLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
  };

export default function TransitionLink({
  children,
  ...props
}: TransitionLinkProps) {
  return <Link {...props}>{children}</Link>;
}
