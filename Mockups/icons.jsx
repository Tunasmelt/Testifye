// icons.jsx — Icon set for Tesifye

const Icon = ({ d, size = 16, stroke = 1.5, fill, style }) => (
  <svg
    className="tf-icon"
    width={size} height={size} viewBox="0 0 24 24"
    fill={fill || "none"} stroke="currentColor"
    strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    style={style}
  >
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

const Icons = {
  // Sparkle / brand
  sparkle: (props) => <Icon {...props} d={<><path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3z"/><path d="M19 4v3M21 5.5h-4M5 17v3M6.5 18.5h-3"/></>} />,
  // Nav
  home: (props) => <Icon {...props} d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2v-9z" />,
  testCases: (props) => <Icon {...props} d={<><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 9h8M8 13h6M8 17h4"/><path d="M16 16l1.5 1.5L20 15" stroke="var(--success)"/></>} />,
  ux: (props) => <Icon {...props} d={<><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="9" r="0.6" fill="currentColor"/><circle cx="15" cy="9" r="0.6" fill="currentColor"/></>} />,
  bug: (props) => <Icon {...props} d={<><path d="M8 6V4a4 4 0 0 1 8 0v2"/><rect x="6" y="6" width="12" height="14" rx="6"/><path d="M3 13h3M18 13h3M4 8l3 1M20 8l-3 1M4 18l3-1M20 18l-3-1"/></>} />,
  gap: (props) => <Icon {...props} d={<><path d="M14 3v5a2 2 0 0 0 2 2h5"/><path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9z"/><path d="M9 14h6M9 17h4"/><circle cx="11" cy="11" r="0.7" fill="currentColor"/><circle cx="14" cy="11" r="0.7" fill="currentColor"/></>} />,
  link: (props) => <Icon {...props} d={<><path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1 1"/><path d="M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 1 0 5.6 5.6l1-1"/></>} />,
  data: (props) => <Icon {...props} d={<><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></>} />,
  chat: (props) => <Icon {...props} d={<><path d="M21 12a8 8 0 0 1-12.4 6.7L4 20l1.3-4.6A8 8 0 1 1 21 12z"/><circle cx="9" cy="12" r="0.6" fill="currentColor"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/><circle cx="15" cy="12" r="0.6" fill="currentColor"/></>} />,
  export: (props) => <Icon {...props} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5-5 5 5"/><path d="M12 5v12"/></>} />,
  persona: (props) => <Icon {...props} d={<><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></>} />,
  globe: (props) => <Icon {...props} d={<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>} />,
  // Misc
  plus: (props) => <Icon {...props} d="M12 5v14M5 12h14" />,
  search: (props) => <Icon {...props} d={<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>} />,
  upload: (props) => <Icon {...props} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></>} />,
  download: (props) => <Icon {...props} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></>} />,
  check: (props) => <Icon {...props} d="M20 6L9 17l-5-5" />,
  checkCircle: (props) => <Icon {...props} d={<><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></>} />,
  alert: (props) => <Icon {...props} d={<><path d="M12 2L1 21h22L12 2z"/><path d="M12 9v5M12 18v0.1"/></>} />,
  info: (props) => <Icon {...props} d={<><circle cx="12" cy="12" r="9"/><path d="M12 8v0.1M12 11v5"/></>} />,
  x: (props) => <Icon {...props} d="M18 6L6 18M6 6l12 12" />,
  chevronRight: (props) => <Icon {...props} d="M9 6l6 6-6 6" />,
  chevronDown: (props) => <Icon {...props} d="M6 9l6 6 6-6" />,
  filter: (props) => <Icon {...props} d="M3 4h18l-7 9v6l-4 2v-8L3 4z" />,
  play: (props) => <Icon {...props} d="M6 4l14 8-14 8V4z" fill="currentColor" />,
  zap: (props) => <Icon {...props} d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />,
  eye: (props) => <Icon {...props} d={<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>} />,
  refresh: (props) => <Icon {...props} d={<><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>} />,
  copy: (props) => <Icon {...props} d={<><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>} />,
  send: (props) => <Icon {...props} d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  more: (props) => <Icon {...props} d={<><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/><circle cx="5" cy="12" r="1" fill="currentColor"/></>} />,
  settings: (props) => <Icon {...props} d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>} />,
  folder: (props) => <Icon {...props} d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />,
  layers: (props) => <Icon {...props} d={<><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></>} />,
  smartphone: (props) => <Icon {...props} d={<><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M11 18h2"/></>} />,
  image: (props) => <Icon {...props} d={<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></>} />,
  trend: (props) => <Icon {...props} d={<><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></>} />,
  // Logo
  logo: ({ size = 28 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Phone frame */}
      <rect x="9" y="3" width="14" height="22" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 22h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {/* Sparkle on top-right */}
      <g transform="translate(20, 4)">
        <path d="M4 0 L5 3 L8 4 L5 5 L4 8 L3 5 L0 4 L3 3 Z" fill="var(--accent-2)" />
        <circle cx="4" cy="4" r="6" fill="var(--accent-2)" opacity="0.18" />
      </g>
    </svg>
  ),
};

window.Icons = Icons;
