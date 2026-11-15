/** Sidebar illustration: a black cat asleep beside a purple toy, dots floating above. */
export function SleepingCat() {
  return (
    <svg className="a-cat" viewBox="0 0 220 190" aria-hidden="true">
      <defs>
        <radialGradient id="a-cat-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#a98cf6" stopOpacity="0.55" />
          <stop offset="1" stopColor="#a98cf6" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* floating dots */}
      <circle cx="107" cy="16" r="9" fill="#c4a8fa" />
      <circle cx="80" cy="47" r="8.5" fill="#c9b0fb" />
      <circle cx="134" cy="41" r="8.5" fill="#c9b0fb" />
      {/* shadow */}
      <ellipse cx="118" cy="170" rx="102" ry="9" fill="url(#a-cat-shadow)" />
      {/* tail: up and curling, white tip */}
      <path
        d="M168 160 C196 152 204 124 199 98 C195 76 182 64 168 66 C158 67 152 76 156 86 C160 95 172 92 177 102 C183 116 178 138 160 146 Z"
        fill="#16131c"
      />
      <path
        d="M156 86 C152 74 160 64 172 65 C184 66 194 76 198 92 L189 90 L186 98 L178 92 L172 100 L166 92 C160 92 158 90 156 86 Z"
        fill="#fff"
        stroke="#16131c"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* body */}
      <path d="M58 168 C46 140 62 106 104 100 C144 95 176 112 178 140 C179 158 168 168 150 168 Z" fill="#16131c" />
      <path d="M134 128 C138 136 138 146 132 154" stroke="#3a3446" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* toy */}
      <ellipse cx="34" cy="163" rx="13" ry="7.5" fill="#8b5cf6" />
      <ellipse cx="31" cy="160.5" rx="5" ry="2.4" fill="#b79cfb" />
      {/* head */}
      <path d="M30 118 L33 82 L58 102 Z" fill="#16131c" />
      <path d="M37 104 L38 92 L50 102 Z" fill="#f4a3c4" />
      <path d="M96 106 L94 72 L72 94 Z" fill="#16131c" />
      <path d="M89 97 L88 85 L79 95 Z" fill="#f4a3c4" />
      <ellipse cx="62" cy="130" rx="36" ry="31" fill="#16131c" />
      {/* face */}
      <path d="M41 128 q7 6 14 0" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M69 128 q7 6 14 0" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M59 138 h6 l-3 3 Z" fill="#f4a3c4" />
      <path d="M57 143 q3 3 5 0 q2 3 5 0" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M86 136 l12 -2 M86 141 l12 2" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity=".85" />
      {/* paws */}
      <ellipse cx="52" cy="164" rx="12" ry="7" fill="#fff" stroke="#16131c" strokeWidth="2.5" />
      <ellipse cx="94" cy="165" rx="12" ry="6.5" fill="#fff" stroke="#16131c" strokeWidth="2.5" />
      <path d="M48 160 v6 M56 160 v6 M90 161 v6 M98 161 v6" stroke="#16131c" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
