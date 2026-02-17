interface BrandingColorSwatchProps {
  hex: string;
  rgb: string;
  name: string;
  large?: boolean;
}

export default function BrandingColorSwatch({
  hex,
  rgb,
  name,
  large = false,
}: BrandingColorSwatchProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${large ? 'h-32 w-32' : 'h-20 w-20'} rounded-2xl shadow-lg`}
        style={{ backgroundColor: hex }}
      />
      <div className="text-center">
        <p className="font-secondary text-sm font-bold text-white">{name}</p>
        <p className="font-mono text-xs text-white/60">{hex}</p>
        <p className="font-mono text-xs text-white/40">{rgb}</p>
      </div>
    </div>
  );
}
