interface StarProps {
  count: number;
  filled: number;
}
export function Stars({ count, filled }: StarProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i + 1}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.825 21L7.45 13.975L2 9.25L9.2 8.625L12 2L14.8 8.625L22 9.25L16.55 13.975L18.175 21L12 17.275L5.825 21Z"
            fill={i < filled ? '#4F46E5' : '#94A3B8'}
          />
        </svg>
      ))}
    </div>
  );
}
