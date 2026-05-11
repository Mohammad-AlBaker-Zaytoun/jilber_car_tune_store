import { Cpu, Wind, Settings2, Circle, Disc3, Zap, Activity, Wrench } from 'lucide-react';
import type { Category } from '@/data/products';

const CATEGORY_ICONS: Record<Category, React.ElementType> = {
  'ECU Tuning': Cpu,
  Exhaust: Wind,
  Suspension: Settings2,
  Wheels: Circle,
  Brakes: Disc3,
  Aero: Zap,
  Diagnostics: Activity,
  Maintenance: Wrench,
};

interface Props {
  category: Category;
  visualColor: string;
  visualColor2: string;
  size?: 'sm' | 'md' | 'lg';
  imageUrl?: string;
  productName?: string;
}

export default function ProductVisual({
  category,
  visualColor,
  visualColor2,
  size = 'md',
  imageUrl,
  productName,
}: Props) {
  const Icon = CATEGORY_ICONS[category];

  const heights: Record<string, string> = {
    sm: 'h-40',
    md: 'h-52',
    lg: 'h-72',
  };

  if (imageUrl) {
    return (
      <div className={`relative group/visual w-full ${heights[size]} overflow-hidden`}>
        <img
          src={imageUrl}
          alt={productName ?? category}
          className="w-full h-full object-cover transition-transform duration-500 group-hover/visual:scale-105"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(6,10,16,0.55), transparent)' }}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full ${heights[size]} overflow-hidden`}
      style={{
        background: `radial-gradient(ellipse 80% 70% at 30% 30%, ${visualColor}22, transparent 65%),
                     radial-gradient(ellipse 60% 50% at 80% 80%, ${visualColor2}33, transparent 60%),
                     linear-gradient(135deg, #0d1117 0%, #060a10 100%)`,
      }}
    >
      {/* Grid texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Diagonal accent line */}
      <div
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden pointer-events-none"
      >
        <div
          className="absolute -top-10 -right-10 w-64 h-px rotate-[35deg] origin-left"
          style={{ background: `linear-gradient(to right, transparent, ${visualColor}40, transparent)` }}
        />
        <div
          className="absolute top-6 -right-10 w-48 h-px rotate-[35deg] origin-left"
          style={{ background: `linear-gradient(to right, transparent, ${visualColor}20, transparent)` }}
        />
      </div>

      {/* Corner glow */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 w-24 h-24 rounded-full blur-2xl opacity-30"
        style={{ background: visualColor }}
      />

      {/* Icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-16 h-16 flex items-center justify-center rounded-sm"
          style={{
            border: `1px solid ${visualColor}30`,
            background: `${visualColor}08`,
          }}
        >
          <Icon
            size={size === 'lg' ? 32 : 24}
            aria-hidden="true"
            style={{ color: visualColor, opacity: 0.85 }}
          />
        </div>
      </div>

      {/* Bottom gradient for readability */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(6,10,16,0.8), transparent)',
        }}
      />
    </div>
  );
}
