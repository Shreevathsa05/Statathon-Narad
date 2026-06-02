export default function NaradIllustration() {
    return (
        <svg viewBox="0 0 320 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", opacity: 0.9 }}>
            {/* Grid lines */}
            {[60, 120, 180, 240].map((x) => (
                <line key={x} x1={x} y1="20" x2={x} y2="260" stroke="#1F1F1F" strokeWidth="1" />
            ))}
            {[60, 120, 180, 220].map((y) => (
                <line key={y} x1="20" y1={y} x2="300" y2={y} stroke="#1F1F1F" strokeWidth="1" />
            ))}

            {/* Bar chart */}
            <rect x="44" y="140" width="32" height="80" rx="2" fill="#1A1A1A" stroke="#2E2E2E" strokeWidth="1" />
            <rect x="44" y="100" width="32" height="80" rx="2" fill="#0070F3" opacity="0.7" />

            <rect x="104" y="100" width="32" height="120" rx="2" fill="#1A1A1A" stroke="#2E2E2E" strokeWidth="1" />
            <rect x="104" y="60" width="32" height="120" rx="2" fill="#0070F3" opacity="0.9" />

            <rect x="164" y="120" width="32" height="100" rx="2" fill="#1A1A1A" stroke="#2E2E2E" strokeWidth="1" />
            <rect x="164" y="80" width="32" height="100" rx="2" fill="#52A8FF" opacity="0.7" />

            <rect x="224" y="80" width="32" height="140" rx="2" fill="#1A1A1A" stroke="#2E2E2E" strokeWidth="1" />
            <rect x="224" y="40" width="32" height="140" rx="2" fill="#0070F3" />

            {/* Trend line */}
            <polyline points="60,160 120,120 180,140 240,80" stroke="#50E3C2" strokeWidth="1.5" fill="none" strokeDasharray="4 3" opacity="0.6" />
            {[{ cx: 60, cy: 160 }, { cx: 120, cy: 120 }, { cx: 180, cy: 140 }, { cx: 240, cy: 80 }].map((p, i) => (
                <circle key={i} cx={p.cx} cy={p.cy} r="3" fill="#50E3C2" opacity="0.8" />
            ))}

            {/* Small stat card */}
            <rect x="196" y="168" width="104" height="60" rx="4" fill="#0A0A0A" stroke="#2E2E2E" strokeWidth="1" />
            <text x="208" y="186" fontSize="9" fill="#525252" fontFamily="monospace">RESPONSE RATE</text>
            <text x="208" y="206" fontSize="18" fontWeight="700" fill="#EDEDED" fontFamily="monospace">84%</text>
            <text x="208" y="222" fontSize="8" fill="#50E3C2" fontFamily="monospace">↑ 3.2% this week</text>
        </svg>
    );
}
