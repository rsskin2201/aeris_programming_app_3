import type { SVGProps } from 'react';

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22c-2.5-1-4-2.5-4-4s1.5-3 4-3 4 1.5 4 3-1.5 3-4 4z" />
      <path d="M12 15c-2.5-1-4-2.5-4-4s1.5-3 4-3 4 1.5 4 3-1.5 3-4 4z" />
      <path d="M12 8c-2.5-1-4-2.5-4-4s1.5-3 4-3 4 1.5 4 3-1.5 3-4 4z" />
    </svg>
  ),
};