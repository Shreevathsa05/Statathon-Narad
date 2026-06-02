const ROLE_CONFIG = {
  admin:         { label: 'Admin',         color: '#000000', bg: 'rgba(0,0,0,0.07)' },
  sdrd:          { label: 'SDRD',          color: '#0070F3', bg: 'rgba(0,112,243,0.08)' },
  fod:           { label: 'FOD',           color: '#0E7C76', bg: 'rgba(14,124,118,0.08)' },
  field_manager: { label: 'Field Mgr',     color: '#B45309', bg: 'rgba(180,83,9,0.08)' },
  field_agent:   { label: 'Field Agent',   color: '#92400E', bg: 'rgba(146,64,14,0.08)' },
  dpd:           { label: 'DPD',           color: '#6D28D9', bg: 'rgba(109,40,217,0.08)' },
  cqcd:          { label: 'CQCD',          color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
  service:       { label: 'Service',       color: '#737373', bg: 'rgba(115,115,115,0.08)' },
};

export default function RoleBadge({ role }) {
  const config = ROLE_CONFIG[role] || { label: role, color: '#737373', bg: 'rgba(115,115,115,0.08)' };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-sm tracking-wide"
      style={{ color: config.color, background: config.bg, border: `1px solid ${config.color}22` }}
    >
      {config.label}
    </span>
  );
}
