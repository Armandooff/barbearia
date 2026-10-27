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
          <rect width="80" height="40" fill="#0a0a0a" />
          <rect x="0" y="0" width="78" height="38" fill="#111" stroke="#1a1a1a" strokeWidth="1" />
          <rect x="40" y="20" width="78" height="38" fill="#0d0d0d" stroke="#1a1a1a" strokeWidth="1" />
        </pattern>
        <filter id="spray">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.15 0" />
        </filter>
      </defs>

      {/* Brick wall */}
      <rect width="1200" height="800" fill="url(#bricks)" />

      {/* Spray overlay */}
      <rect width="1200" height="800" filter="url(#spray)" opacity="0.4" />

      {/* Stencil: scissors silhouette */}
      <g transform="translate(820,180) scale(1.6)" opacity="0.18" fill="#fff">
        <path d="M40 0 L55 30 L45 35 L30 15 Z" />
        <path d="M60 0 L45 30 L55 35 L70 15 Z" />
        <circle cx="42" cy="42" r="14" />
        <circle cx="58" cy="42" r="14" />
        <rect x="48" y="30" width="4" height="60" />
      </g>

      {/* Graffiti tags */}
      <g className="graffiti-text" fill="#fff" opacity="0.28" fontFamily="Impact, sans-serif">
        <text x="60" y="140" fontSize="72" transform="rotate(-8 60 140)">GUI</text>
        <text x="120" y="220" fontSize="48" transform="rotate(6 120 220)">CORTES</text>
        <text x="880" y="160" fontSize="56" transform="rotate(10 880 160)">FADE</text>
        <text x="920" y="620" fontSize="60" transform="rotate(-12 920 620)">BARBA</text>
        <text x="100" y="700" fontSize="40" transform="rotate(4 100 700)">STYLE</text>
        <text x="600" y="80" fontSize="36" transform="rotate(-5 600 80)">CORTE</text>
        <text x="700" y="720" fontSize="44" transform="rotate(8 700 720)">TESOURA</text>
        <text x="300" y="650" fontSize="38" transform="rotate(-6 300 650)">STREET</text>
      </g>

      {/* Spray splatters */}
      <g fill="#fff" opacity="0.15">
        <circle cx="200" cy="300" r="24" />
        <circle cx="230" cy="310" r="12" />
        <circle cx="180" cy="330" r="8" />
        <circle cx="950" cy="200" r="30" />
        <circle cx="990" cy="220" r="14" />
        <circle cx="920" cy="230" r="10" />
        <circle cx="600" cy="700" r="40" />
        <circle cx="640" cy="720" r="18" />
      </g>

      {/* Drips */}
      <g fill="#fff" opacity="0.2">
        <rect x="300" y="0" width="3" height="120" />
        <rect x="320" y="0" width="2" height="80" />
        <rect x="700" y="0" width="4" height="160" />
        <rect x="720" y="0" width="2" height="90" />
      </g>
    </svg>
  );
}