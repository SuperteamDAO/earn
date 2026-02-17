interface BrandingSTLogoProps {
  fill?: string;
  size?: number;
  className?: string;
  showWordmark?: boolean;
}

export default function BrandingSTLogo({
  fill = '#000000',
  size = 120,
  className = '',
  showWordmark = false,
}: BrandingSTLogoProps) {
  const wordmarkScale = size / 120;

  return (
    <div className={`inline-flex flex-col items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size * (32 / 42)}
        viewBox="0 0 42 32"
        fill={fill}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M32.6944 4.90892H41.4468V8.28973C41.4468 12.8741 37.742 16.5795 33.1571 16.5795H32.6938L32.6944 4.90892ZM20.2372 0H32.6944V31.9071H31.2127C22.1822 31.9071 20.3765 25.6088 20.3765 20.0055L20.2372 0ZM0 7.22433C0 12.9205 4.07522 15.0043 8.61369 15.6993H0V32H8.28973C16.6252 32 17.5978 28.2952 17.5978 24.7757C17.5978 20.4688 14.6338 17.459 10.0495 16.3007H17.5978V0H9.30807C0.972554 0 0 3.70477 0 7.22433Z" />
      </svg>
      {showWordmark && (
        <span
          className="font-secondary font-bold tracking-tight"
          style={{ fontSize: `${28 * wordmarkScale}px`, color: fill }}
        >
          superteam
        </span>
      )}
    </div>
  );
}
