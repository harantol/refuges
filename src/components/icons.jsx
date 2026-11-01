// Icônes SVG "outline" style Google Maps (Material Symbols), en stroke currentColor.
const Svg = ({ children, size = 20 }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

// mini calques superposés (sélecteur de fond de carte)
export const IconLayers = (p) => (
  <Svg {...p}>
    <path d="M12 3 3 8l9 5 9-5-9-5z" />
    <path d="m3 12.5 9 5 9-5" />
    <path d="m3 17 9 5 9-5" />
  </Svg>
);

// loupe (recherche / zone visible)
export const IconSearch = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20.5 20.5-4.6-4.6" />
  </Svg>
);

// cible / croix de localisation (ma position)
export const IconLocate = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
    <circle cx="12" cy="12" r="8" strokeDasharray="0.1 3.2" strokeWidth="1.6" />
  </Svg>
);

// entonnoir (filtres)
export const IconFilter = (p) => (
  <Svg {...p}>
    <path d="M3.5 5h17l-6.5 7.5v5l-4 2v-7L3.5 5z" />
  </Svg>
);

// utilisateur en contour (compte / login)
export const IconUser = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20c.8-3.6 3.9-5.4 7.5-5.4s6.7 1.8 7.5 5.4" />
  </Svg>
);
