interface BrandingSectionHeaderProps {
  num: string;
  title: string;
  id?: string;
}

export default function BrandingSectionHeader({
  num,
  title,
  id,
}: BrandingSectionHeaderProps) {
  return (
    <div id={id} className="mb-10 flex items-baseline gap-4 pt-20">
      <span className="font-secondary text-lg text-[#f4a60b]">{num}</span>
      <h2 className="section-heading text-2xl md:text-4xl">{title}</h2>
    </div>
  );
}
