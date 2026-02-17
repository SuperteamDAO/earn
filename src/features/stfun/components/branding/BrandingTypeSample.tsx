interface BrandingTypeSampleProps {
  label: string;
  font: string;
  weight: string;
  weightNum: number;
  sample: string;
  large?: boolean;
}

export default function BrandingTypeSample({
  label,
  font,
  weight,
  weightNum,
  sample,
  large = false,
}: BrandingTypeSampleProps) {
  const sizeMap: Record<string, string> = {
    H1: large ? 'text-5xl md:text-7xl' : 'text-3xl md:text-5xl',
    H2: large ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl',
    B1: 'text-base md:text-lg',
    B2: 'text-sm md:text-base',
  };

  return (
    <div className="flex flex-col gap-2 border-b border-white/10 py-6 md:flex-row md:items-baseline md:gap-8">
      <div className="w-16 shrink-0">
        <span className="font-secondary text-sm font-bold text-white/40">
          {label}
        </span>
      </div>
      <div className="flex-1">
        <p
          className={`font-secondary leading-tight tracking-tight text-white ${sizeMap[label] ?? 'text-base'}`}
          style={{ fontWeight: weightNum }}
        >
          {sample}
        </p>
        <p className="mt-2 text-xs text-white/40">
          {font} {weight}
        </p>
      </div>
    </div>
  );
}
