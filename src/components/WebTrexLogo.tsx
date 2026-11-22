interface WebTrexLogoProps {
  size?: number;
  showWordmark?: boolean;
}

export function WebTrexLogo({ size = 32, showWordmark = true }: WebTrexLogoProps) {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 select-none">
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="1.5"
          y="1.5"
          width="33"
          height="33"
          rx="8"
          fill="#0E1629"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="1.5"
        />
        <path
          d="M8.5 11.5L13.2 24.5L18 14.5L22.8 24.5L27.5 11.5"
          stroke="#F8FAFC"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14.5 11.5H21.5"
          stroke="#2878FF"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
      {showWordmark && (
        <span className="font-display text-lg font-bold tracking-tight text-white">
          WebTrex
        </span>
      )}
    </span>
  );
}
