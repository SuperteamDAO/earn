interface TalentProfileBackgroundProps {
  readonly bgIndex: number;
  readonly className?: string;
}

export function TalentProfileBackground({
  bgIndex,
  className = '',
}: TalentProfileBackgroundProps) {
  const bgNum = bgIndex + 1;

  return (
    <picture>
      <source
        media="(min-width: 640px)"
        srcSet={`/earn/assets/backgrounds/${bgNum}-desktop.avif`}
        type="image/avif"
      />
      <source
        media="(min-width: 640px)"
        srcSet={`/earn/assets/backgrounds/${bgNum}-desktop.webp`}
        type="image/webp"
      />
      <source
        media="(max-width: 639px)"
        srcSet={`/earn/assets/backgrounds/${bgNum}-mobile.avif`}
        type="image/avif"
      />
      <source
        media="(max-width: 639px)"
        srcSet={`/earn/assets/backgrounds/${bgNum}-mobile.webp`}
        type="image/webp"
      />
      <img
        src={`/earn/assets/backgrounds/${bgNum}-mobile.webp`}
        alt=""
        className={className}
        style={{ objectFit: 'cover' }}
        loading="eager"
        fetchPriority="high"
      />
    </picture>
  );
}
