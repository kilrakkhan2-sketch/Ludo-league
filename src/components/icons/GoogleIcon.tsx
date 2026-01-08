import { SVGProps } from 'react';

export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
      <path d="M22 12H18" />
      <path d="M6 12H2" />
      <path d="M12 6V2" />
      <path d="M12 22V18" />
      <path d="M15.5 15.5L18.36 18.36" />
      <path d="M8.5 8.5L5.64 5.64" />
      <path d="M15.5 8.5L18.36 5.64" />
      <path d="M8.5 15.5L5.64 18.36" />
    </svg>
  );
}
