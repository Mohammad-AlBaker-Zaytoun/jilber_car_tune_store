import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  breadcrumbs?: Crumb[];
  action?: React.ReactNode;
}

export default function AdminPageHeader({ title, subtitle, breadcrumbs, action }: Props) {
  return (
    <div className="mb-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-semibold mb-4">
          <Link href="/admin" className="text-zinc-600 hover:text-cyan-400 transition-colors">
            Admin
          </Link>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <ChevronRight size={9} className="text-zinc-700" aria-hidden="true" />
              {crumb.href ? (
                <Link href={crumb.href} className="text-zinc-600 hover:text-cyan-400 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-zinc-400">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-6 h-px bg-cyan-400 shrink-0" aria-hidden="true" />
            <span className="text-[10px] text-cyan-400 tracking-[0.3em] uppercase font-bold">
              Admin
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0 mt-1">{action}</div>}
      </div>
    </div>
  );
}
