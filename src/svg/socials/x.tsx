import React, { type CSSProperties } from 'react';
export const X = ({ styles }: { styles?: CSSProperties }) => {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={styles}
    >
      <rect width="48" height="48" rx="24" fill="#0F172A" />
      <path
        d="M31.5864 13.149H35.6323L26.794 23.2075L37.1915 36.8936H29.0497L22.6743 28.5922L15.3781 36.8936H11.3283L20.7826 26.136L10.8085 13.149H19.1561L24.9208 20.7367L31.5864 13.149ZM30.167 34.4822H32.4096L17.9372 15.4337H15.5311L30.167 34.4822Z"
        fill="white"
      />
    </svg>
  );
};
