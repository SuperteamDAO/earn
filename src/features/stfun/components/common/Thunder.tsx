interface ThunderProps {
  size?: number;
}

export default function Thunder({ size = 16 }: ThunderProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.66667 1.33334L2 9.33334H8L7.33333 14.6667L14 6.66668H8L8.66667 1.33334Z"
        stroke="#868686"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
