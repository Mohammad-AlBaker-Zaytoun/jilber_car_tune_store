import type { ReactNode } from 'react';

type Props = {
  tag: string;
  heading: ReactNode;
  sub?: string;
  /** Left-aligned (default) shows a leading dash. Center shows flanking dashes. */
  align?: 'left' | 'center';
  className?: string;
};

export default function SectionHeader({
  tag,
  heading,
  sub,
  align = 'left',
  className = '',
}: Props) {
  const centered = align === 'center';

  return (
    <div className={`${centered ? 'text-center' : ''} ${className}`.trim()}>
      {/* Tag line */}
      <div
        className={`inline-flex items-center gap-2.5 mb-5 ${
          centered ? 'justify-center' : ''
        }`}
      >
        <div className="w-7 h-px bg-cyan-400 shrink-0" aria-hidden="true" />
        <span className="text-[10px] sm:text-xs text-cyan-400 tracking-[0.3em] uppercase font-bold whitespace-nowrap">
          {tag}
        </span>
        {centered && (
          <div className="w-7 h-px bg-cyan-400 shrink-0" aria-hidden="true" />
        )}
      </div>

      {/* Heading */}
      <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none mb-5">
        {heading}
      </h2>

      {/* Optional sub-text */}
      {sub && (
        <p
          className={`text-zinc-400 text-base lg:text-lg leading-relaxed ${
            centered ? 'max-w-2xl mx-auto' : 'max-w-xl'
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
