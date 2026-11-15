/** Minimal 24×24 line icons (stroke = currentColor). Drawn for the dashboard; no icon library. */
import type { ReactNode, SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };
const Svg = ({ size = 20, children, ...rest }: P & { children: ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

export const IconGrid = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </Svg>
);
export const IconUsers = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.2" />
    <path d="M5.5 19.5c.6-3.3 3.3-5.3 6.5-5.3s5.9 2 6.5 5.3" />
    <circle cx="5.2" cy="9.3" r="2.3" />
    <path d="M1.8 17.6c.4-2.2 1.9-3.5 3.9-3.6" />
    <circle cx="18.8" cy="9.3" r="2.3" />
    <path d="M22.2 17.6c-.4-2.2-1.9-3.5-3.9-3.6" />
  </Svg>
);
export const IconGamepad = (p: P) => (
  <Svg {...p}>
    <path d="M7.2 6.5h9.6a4.6 4.6 0 0 1 4.5 3.7l1 5.3a2.7 2.7 0 0 1-4.6 2.4L15.6 16H8.4l-2.1 1.9a2.7 2.7 0 0 1-4.6-2.4l1-5.3a4.6 4.6 0 0 1 4.5-3.7Z" />
    <path d="M7.5 9.5v4M5.5 11.5h4" />
    <circle cx="15.5" cy="10.3" r=".6" fill="currentColor" />
    <circle cx="17.6" cy="12.4" r=".6" fill="currentColor" />
    <circle cx="13.4" cy="12.4" r=".6" fill="currentColor" />
    <circle cx="15.5" cy="14.5" r=".6" fill="currentColor" />
  </Svg>
);
export const IconCalendar = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Svg>
);
export const IconChevronDown = (p: P) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);
export const IconChevronLeft = (p: P) => (
  <Svg {...p}>
    <path d="m15 6-6 6 6 6" />
  </Svg>
);
export const IconChevronRight = (p: P) => (
  <Svg {...p}>
    <path d="m9 6 6 6-6 6" />
  </Svg>
);
export const IconArrowLeft = (p: P) => (
  <Svg {...p}>
    <path d="M19 12H5m6-6-6 6 6 6" />
  </Svg>
);
export const IconRefresh = (p: P) => (
  <Svg {...p}>
    <path d="M20 11.5A8 8 0 0 0 6 6.3L4 8.2" />
    <path d="M4 3.8v4.4h4.4" />
    <path d="M4 12.5a8 8 0 0 0 14 5.2l2-1.9" />
    <path d="M20 20.2v-4.4h-4.4" />
  </Svg>
);
export const IconUser = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="8.2" r="3.7" />
    <path d="M4.8 20c.8-3.8 3.7-6 7.2-6s6.4 2.2 7.2 6" />
  </Svg>
);
export const IconLogout = (p: P) => (
  <Svg {...p}>
    <path d="M10 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H10" />
    <path d="M15 8l4 4-4 4M19 12H9.5" />
  </Svg>
);
export const IconPulse = (p: P) => (
  <Svg {...p}>
    <path d="M2.5 12.5h4l2.5-6 4.5 12 2.7-6h5.3" />
  </Svg>
);
export const IconLayers = (p: P) => (
  <Svg {...p}>
    <path d="m12 3.5 9 4.6-9 4.6-9-4.6 9-4.6Z" />
    <path d="m3 12.2 9 4.6 9-4.6" />
    <path d="m3 16.2 9 4.6 9-4.6" />
  </Svg>
);
export const IconTrophy = (p: P) => (
  <Svg {...p}>
    <path d="M7.5 4h9v5.5a4.5 4.5 0 0 1-9 0V4Z" />
    <path d="M7.5 6H4.2v1.2A3.5 3.5 0 0 0 7.7 10.7M16.5 6h3.3v1.2a3.5 3.5 0 0 1-3.5 3.5" />
    <path d="M12 14v3.5M8.5 20.5h7M9.5 20.5c0-1.7 1.1-3 2.5-3s2.5 1.3 2.5 3" />
  </Svg>
);
export const IconPlay = (p: P) => (
  <Svg {...p}>
    <path d="M7 4.8v14.4a.8.8 0 0 0 1.2.7l11.5-7.2a.8.8 0 0 0 0-1.4L8.2 4.1a.8.8 0 0 0-1.2.7Z" />
  </Svg>
);
export const IconSearch = (p: P) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.3-4.3" />
  </Svg>
);
export const IconX = (p: P) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);
export const IconPhone = (p: P) => (
  <Svg {...p}>
    <rect x="6.5" y="2.8" width="11" height="18.4" rx="2.4" />
    <path d="M10.5 18h3" />
  </Svg>
);
export const IconTablet = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="2.8" width="16" height="18.4" rx="2.4" />
    <path d="M10.5 18h3" />
  </Svg>
);
export const IconMonitor = (p: P) => (
  <Svg {...p}>
    <rect x="2.8" y="4" width="18.4" height="12.5" rx="2" />
    <path d="M9 20.5h6M12 16.5v4" />
  </Svg>
);
export const IconAndroid = (p: P) => (
  <Svg {...p}>
    <path d="M6 10.5h12v7.2a1.3 1.3 0 0 1-1.3 1.3H7.3A1.3 1.3 0 0 1 6 17.7v-7.2Z" />
    <path d="M6 9.5a6 6 0 0 1 12 0Z" />
    <path d="M8 4.5l1.3 2M16 4.5l-1.3 2M3.8 11v5M20.2 11v5M9.5 19v2.2M14.5 19v2.2" />
  </Svg>
);
export const IconSort = (p: P & { dir?: 'asc' | 'desc' | null }) => {
  const { dir, ...rest } = p;
  return (
    <Svg strokeWidth={2} {...rest}>
      <path d="m8 9.5 4-4 4 4" opacity={dir === 'desc' ? 0.3 : 1} />
      <path d="m8 14.5 4 4 4-4" opacity={dir === 'asc' ? 0.3 : 1} />
    </Svg>
  );
};
export const IconDownload = (p: P) => (
  <Svg {...p}>
    <path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5M5 19.5h14" />
  </Svg>
);
export const IconCheck = (p: P) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);
export const IconMenu = (p: P) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);
export const IconBell = (p: P) => (
  <Svg {...p}>
    <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.6 1.8a.5.5 0 0 1-.4.8H4.8a.5.5 0 0 1-.4-.8L6 16.5Z" />
    <path d="M9.8 21.2a2.4 2.4 0 0 0 4.4 0" />
  </Svg>
);
export const IconClock = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 7.4V12h4" />
  </Svg>
);
export const IconBars = (p: P) => (
  <Svg {...p}>
    <path d="M5 20V12.5M9.7 20V7M14.3 20V4.5M19 20V10" strokeWidth={2.4} />
    <path d="M3.5 20.5h17" />
  </Svg>
);
export const IconArrowUp = (p: P) => (
  <Svg strokeWidth={2.4} {...p}>
    <path d="M12 19.5V5m-6 6 6-6 6 6" />
  </Svg>
);
/** filled white gamepad (logo) */
export const IconGamepadSolid = ({ size = 28, ...rest }: P) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" {...rest}>
    <path
      fill="currentColor"
      d="M9.6 7.5h12.8c3.3 0 6.1 2.4 6.6 5.7l1.2 7.6c.5 3.2-2 6-5.2 5.7-1.6-.1-2.9-1.1-3.6-2.5l-.8-1.7c-.3-.6-.9-1-1.6-1h-6c-.7 0-1.3.4-1.6 1l-.8 1.7c-.7 1.4-2 2.4-3.6 2.5-3.2.3-5.7-2.5-5.2-5.7L3 13.2c.5-3.3 3.3-5.7 6.6-5.7Z"
    />
    <path d="M10.6 11.6v6M7.6 14.6h6" stroke="#6a36e6" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="21.4" cy="12.7" r="1.5" fill="#6a36e6" />
    <circle cx="24.4" cy="15.7" r="1.5" fill="#6a36e6" />
    <circle cx="18.4" cy="15.7" r="1.5" fill="#6a36e6" />
    <circle cx="21.4" cy="18.7" r="1.5" fill="#6a36e6" />
  </svg>
);
export const IconPie = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5v8.5h8.5" />
    <path d="M20.5 12A8.5 8.5 0 1 1 12 3.5a8.5 8.5 0 0 1 8.5 8.5Z" />
  </Svg>
);
