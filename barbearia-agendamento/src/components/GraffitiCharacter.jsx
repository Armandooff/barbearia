export default function GraffitiCharacter({ className = '' }) {
  return (
    <svg
      className={`pointer-events-none ${className}`}
      viewBox="0 0 260 420"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cap */}
      <path d="M95 30 L165 30 L175 55 L85 55 Z" fill="#fff" />
      <rect x="85" y="55" width="90" height="8" fill="#fff" />
      <path d="M85 63 Q130 75 175 63" fill="none" stroke="#fff" strokeWidth="2" />

      {/* Head */}
      <circle cx="130" cy="100" r="42" fill="#fff" opacity="0.9" />
      {/* Sunglasses */}
      <rect x="95" y="88" width="30" height="18" rx="5" fill="#000" />
      <rect x="135" y="88" width="30" height="18" rx="5" fill="#000" />
      <rect x="125" y="93" width="10" height="4" fill="#000" />
      {/* Mouth */}
      <path d="M118 118 Q130 128 142 118" fill="none" stroke="#000" strokeWidth="2" />

      {/* Neck */}
      <rect x="118" y="142" width="24" height="18" fill="#fff" opacity="0.85" />

      {/* Body / apron */}
      <path d="M90 160 L170 160 L185 300 L75 300 Z" fill="#fff" opacity="0.85" />
      <path d="M95 165 L165 165 L175 295 L85 295 Z" fill="none" stroke="#000" strokeWidth="1.5" opacity="0.3" />
      {/* Apron pocket */}
      <rect x="105" y="230" width="50" height="35" rx="4" fill="none" stroke="#000" strokeWidth="1.5" opacity="0.4" />

      {/* Spray can (left hand) */}
      <g transform="translate(40,185) rotate(-20)">
        <rect x="0" y="0" width="30" height="62" rx="5" fill="#fff" />
        <rect x="6" y="-14" width="18" height="16" rx="3" fill="#fff" />
        <circle cx="15" cy="-22" r="7" fill="#fff" />
        {/* Spray effect */}
        <g opacity="0.5" fill="#fff">
          <circle cx="15" cy="-30" r="3" />
          <circle cx="8" cy="-36" r="2" />
          <circle cx="22" cy="-38" r="2.5" />
          <circle cx="15" cy="-46" r="1.5" />
        </g>
      </g>

      {/* Scissors (right hand) */}
      <g transform="translate(195,190) rotate(20)">
        <circle cx="0" cy="0" r="13" fill="none" stroke="#fff" strokeWidth="3" />
        <circle cx="28" cy="0" r="13" fill="none" stroke="#fff" strokeWidth="3" />
        <line x1="10" y1="9" x2="42" y2="62" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
        <line x1="18" y1="9" x2="50" y2="62" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
        {/* Blade shine */}
        <line x1="12" y1="12" x2="40" y2="58" stroke="#000" strokeWidth="1" opacity="0.3" />
      </g>

      {/* Legs */}
      <rect x="95" y="300" width="30" height="80" fill="#fff" opacity="0.8" />
      <rect x="135" y="300" width="30" height="80" fill="#fff" opacity="0.8" />

      {/* Sneakers */}
      <ellipse cx="110" cy="390" rx="28" ry="13" fill="#fff" opacity="0.9" />
      <ellipse cx="150" cy="390" rx="28" ry="13" fill="#fff" opacity="0.9" />
      {/* Sole lines */}
      <line x1="88" y1="390" x2="132" y2="390" stroke="#000" strokeWidth="1" opacity="0.4" />
      <line x1="128" y1="390" x2="172" y2="390" stroke="#000" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}