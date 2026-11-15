/** Sidebar illustration: a black cat asleep on a stack of purple pixels. */
export function SleepingCat() {
  return (
    <svg className="a-cat" viewBox="0 0 200 150" aria-hidden="true">
      <defs>
        <linearGradient id="a-cat-hill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e9e1fb" />
          <stop offset="1" stopColor="#f3effc" />
        </linearGradient>
      </defs>
      {/* hill */}
      <path d="M0 118 C40 100 80 104 120 108 S185 104 200 96 V150 H0 Z" fill="url(#a-cat-hill)" />
      {/* floating pixels */}
      <rect x="96" y="14" width="8" height="8" fill="#b9a5f5" />
      <rect x="112" y="30" width="7" height="7" fill="#cdbff8" />
      <rect x="80" y="38" width="9" height="9" fill="#c4b4f7" />
      <rect x="104" y="47" width="6" height="6" fill="#ddd3fa" />
      {/* tail */}
      <path
        d="M150 112 C176 108 184 84 176 64 C170 50 154 44 146 54 C140 62 150 66 156 72 C164 82 160 98 146 102 Z"
        fill="#111"
      />
      <path d="M146 54 C152 46 166 46 173 56 L166 58 L162 52 L157 58 L151 55 Z" fill="#fff" stroke="#111" strokeWidth="2" strokeLinejoin="round" />
      {/* body */}
      <path d="M58 116 C52 92 72 72 104 72 C136 72 158 86 156 106 C155 116 146 120 132 120 H70 C62 120 59 119 58 116 Z" fill="#111" />
      <path d="M122 106 C128 102 134 104 136 110" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* pixel stack under the head */}
      <g stroke="#5a3dc8" strokeWidth="1">
        <rect x="36" y="100" width="11" height="11" fill="#9b84ef" />
        <rect x="36" y="111" width="11" height="11" fill="#7b5ee6" />
        <rect x="47" y="111" width="11" height="11" fill="#b3a0f4" />
        <rect x="58" y="111" width="11" height="11" fill="#7b5ee6" />
        <rect x="69" y="111" width="11" height="11" fill="#9b84ef" />
      </g>
      {/* head */}
      <path d="M44 90 L46 62 L62 74 Z" fill="#111" />
      <path d="M50 73 L49 66 L57 72 Z" fill="#f4b8e0" />
      <path d="M90 80 L86 54 L72 68 Z" fill="#111" />
      <path d="M84 70 L83 61 L77 67 Z" fill="#f4b8e0" />
      <ellipse cx="66" cy="94" rx="27" ry="21" fill="#111" />
      <path d="M50 96 q5 4 10 0" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M71 96 q5 4 10 0" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M62 103 q3 2.5 4 0 q1 2.5 4 0" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M64.5 100.5 h3 l-1.5 1.6 Z" fill="#fff" />
      {/* paw */}
      <ellipse cx="84" cy="114" rx="11" ry="6" fill="#111" />
    </svg>
  );
}
