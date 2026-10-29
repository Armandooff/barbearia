export default function GraffitiWall() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="bricks" width="80" height="40" patternUnits="userSpaceOnUse">
          <rect width="80" height="40" fill="#151310" />
          <rect x="0" y="0" width="78" height="38" fill="#191613" stroke="#27221d" strokeWidth="1" />
          <rect x="40" y="20" width="78" height="38" fill="#141210" stroke="#27221d" strokeWidth="1" />
        </pattern>
        <filter id="spray">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.18 0" />
        </filter>
        <filter id="drip">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
      </defs>

      {/* Brick wall */}
      <rect width="1200" height="800" fill="url(#bricks)" />

      {/* Spray overlay */}
      <rect width="1200" height="800" filter="url(#spray)" opacity="0.5" />

      {/* Big graffiti tag */}
      <g opacity="0.32" fill="#ed3658" fontFamily="Impact, sans-serif">
        <text x="60" y="180" fontSize="150" transform="rotate(-6 60 180)" letterSpacing="4">GUICORTES</text>
      </g>

      {/* Secondary tags */}
      <g opacity="0.28" fill="#12cdb2" fontFamily="Impact, sans-serif">
        <text x="80" y="320" fontSize="64" transform="rotate(8 80 320)">FADE</text>
        <text x="900" y="260" fontSize="72" transform="rotate(-10 900 260)">BARBA</text>
        <text x="120" y="620" fontSize="52" transform="rotate(5 120 620)">STREET</text>
        <text x="850" y="680" fontSize="60" transform="rotate(-7 850 680)">STYLE</text>
        <text x="500" y="720" fontSize="44" transform="rotate(3 500 720)">CORTE</text>
        <text x="300" y="420" fontSize="48" transform="rotate(-4 300 420)">TESOURA</text>
        <text x="700" y="420" fontSize="40" transform="rotate(6 700 420)">BARBEARIA</text>
      </g>

      {/* Stencil character: figure with spray can and scissors */}
      <g transform="translate(880,300)" opacity="0.16" fill="#f3d64e">
        {/* cap */}
        <path d="M20 0 L90 0 L100 25 L10 25 Z" />
        <rect x="10" y="25" width="90" height="6" />
        {/* head */}
        <circle cx="55" cy="55" r="32" />
        {/* sunglasses */}
        <rect x="30" y="45" width="22" height="14" rx="3" fill="#000" />
        <rect x="58" y="45" width="22" height="14" rx="3" fill="#000" />
        <rect x="52" y="50" width="6" height="3" fill="#000" />
        {/* body */}
        <path d="M30 90 L80 90 L90 200 L20 200 Z" />
        {/* spray can (left) */}
        <g transform="translate(-10,110) rotate(-20)">
          <rect x="0" y="0" width="24" height="50" rx="4" />
          <rect x="5" y="-10" width="14" height="12" rx="2" />
          <circle cx="12" cy="-18" r="5" />
        </g>
        {/* scissors (right) */}
        <g transform="translate(95,115) rotate(20)">
          <circle cx="0" cy="0" r="10" fill="none" stroke="#fff" strokeWidth="3" />
          <circle cx="24" cy="0" r="10" fill="none" stroke="#fff" strokeWidth="3" />
          <line x1="8" y1="7" x2="36" y2="52" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
          <line x1="16" y1="7" x2="44" y2="52" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        </g>
        {/* legs */}
        <rect x="32" y="200" width="22" height="70" />
        <rect x="58" y="200" width="22" height="70" />
        {/* sneakers */}
        <ellipse cx="43" cy="280" rx="22" ry="10" />
        <ellipse cx="69" cy="280" rx="22" ry="10" />
      </g>

      {/* Spray splatters */}
      <g fill="#f3d64e" opacity="0.28">
        <circle cx="200" cy="280" r="30" />
        <circle cx="235" cy="295" r="14" />
        <circle cx="175" cy="310" r="9" />
        <circle cx="980" cy="180" r="36" />
        <circle cx="1025" cy="205" r="16" />
        <circle cx="945" cy="215" r="11" />
        <circle cx="580" cy="700" r="45" />
        <circle cx="630" cy="725" r="20" />
        <circle cx="300" cy="150" r="22" />
        <circle cx="330" cy="170" r="10" />
      </g>

      {/* Drips */}
      <g fill="#ed3658" opacity="0.42" filter="url(#drip)">
        <rect x="150" y="0" width="3" height="100" />
        <rect x="170" y="0" width="2" height="60" />
        <rect x="420" y="0" width="4" height="140" />
        <rect x="440" y="0" width="2" height="90" />
        <rect x="780" y="0" width="3" height="120" />
        <rect x="800" y="0" width="2" height="70" />
        <rect x="1050" y="0" width="4" height="160" />
        <rect x="1070" y="0" width="2" height="100" />
      </g>

      {/* Horizontal streaks */}
      <g stroke="#12cdb2" strokeWidth="1" opacity="0.14">
        <line x1="0" y1="250" x2="1200" y2="250" />
        <line x1="0" y1="500" x2="1200" y2="500" />
        <line x1="0" y1="700" x2="1200" y2="700" />
      </g>
    </svg>
  );
}
