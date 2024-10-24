import React, { type CSSProperties } from 'react';

export const BountyIcon = ({ styles }: { styles?: CSSProperties }) => {
  return (
    <svg
      width="16"
      height="18"
      viewBox="0 0 17 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={styles}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.47644 14.3784C8.47644 15.0781 9.38385 15.3528 9.77194 14.7707L14.0291 8.38494C14.3424 7.91501 14.0055 7.28557 13.4407 7.28557H10.0478V3.33548C10.0478 2.63584 9.14043 2.3611 8.75235 2.94324L4.49518 9.32898C4.1819 9.79891 4.51877 10.4284 5.08355 10.4284H8.47644V14.3784Z"
        fill="parent"
      />
    </svg>
  );
};
