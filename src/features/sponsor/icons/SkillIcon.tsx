import type { SVGProps } from 'react';

export function SkillIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#clip0_415_9)">
        <path
          d="M14 9C11.2375 9 9 11.2375 9 14C9 16.7625 11.2375 19 14 19C16.7625 19 19 16.7625 19 14C19 11.2375 16.7625 9 14 9ZM25.175 12.75C24.6 7.5375 20.4625 3.4 15.25 2.825V0.25H12.75V2.825C7.5375 3.4 3.4 7.5375 2.825 12.75H0.25V15.25H2.825C3.4 20.4625 7.5375 24.6 12.75 25.175V27.75H15.25V25.175C20.4625 24.6 24.6 20.4625 25.175 15.25H27.75V12.75H25.175ZM14 22.75C9.1625 22.75 5.25 18.8375 5.25 14C5.25 9.1625 9.1625 5.25 14 5.25C18.8375 5.25 22.75 9.1625 22.75 14C22.75 18.8375 18.8375 22.75 14 22.75Z"
          fill="#6366F1"
        />
      </g>
      <defs>
        <clipPath id="clip0_415_9">
          <rect width="28" height="28" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
