import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import RoleBadge from './RoleBadge.jsx';
import { 
  Users, 
  ClipboardList, 
  Globe, 
  BarChart, 
  Megaphone, 
  User, 
  Map, 
  FileText, 
  CheckCircle, 
  Download, 
  Search,
  LogOut
} from 'lucide-react';

// Role → nav sections map
const NAV = {
  admin: [
    { section: 'Platform', links: [
      { to: '/admin/users', label: 'User Management', icon: Users },
    ]},
    { section: 'Divisions', links: [
      { to: '/sdrd',        label: 'SDRD',          icon: ClipboardList },
      { to: '/fod',         label: 'FOD',           icon: Globe },
      { to: '/dpd',         label: 'DPD',           icon: BarChart },
      { to: '/cqcd',        label: 'CQCD',          icon: Megaphone },
    ]},
  ],
  sdrd: [
    { section: 'SDRD', links: [
      { to: '/sdrd',        label: 'Survey Builder', icon: ClipboardList },
    ]},
  ],
  fod: [
    { section: 'FOD', links: [
      { to: '/fod',         label: 'Delivery',      icon: Globe },
      { to: '/fod/managers',label: 'Field Managers',icon: User },
    ]},
  ],
  field_manager: [
    { section: 'Field Ops', links: [
      { to: '/fod-manager',        label: 'Overview',    icon: Map },
      { to: '/fod-manager/agents', label: 'Field Agents', icon: User },
    ]},
  ],
  field_agent: [
    { section: 'My Work', links: [
      { to: '/field-agent',         label: 'My Surveys',  icon: FileText },
      { to: '/field-agent/submit',  label: 'Submit',      icon: CheckCircle },
    ]},
  ],
  dpd: [
    { section: 'DPD', links: [
      { to: '/dpd',         label: 'Data View',    icon: BarChart },
      { to: '/dpd/export',  label: 'Export',       icon: Download },
    ]},
  ],
  cqcd: [
    { section: 'CQCD', links: [
      { to: '/cqcd',         label: 'Overview',    icon: Search },
      { to: '/cqcd/reports', label: 'Reports',     icon: Megaphone },
    ]},
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const sections = NAV[user.role] || [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="w-64 shrink-0 border-r border-border bg-surface-alt flex flex-col sticky top-0 h-screen">
      <div className="flex items-center gap-3 p-5 border-b border-border">
        <div className="bg-text-primary text-bg w-6 h-6 flex items-center justify-center rounded font-bold text-sm">N</div>
        <div>
          <div className="font-bold text-sm tracking-tight">NARAD</div>
          <div className="text-[10px] text-text-muted uppercase tracking-wider leading-none mt-[2px]">MoSPI</div>
        </div>
      </div>

      {sections.map(({ section, links }) => (
        <div key={section} className="flex flex-col gap-1 pt-4 px-2">
          <div className="text-[11px] uppercase tracking-wider text-text-muted mb-2 px-2">{section}</div>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin/users' || to === '/sdrd' || to === '/fod' || to === '/dpd' || to === '/cqcd'}
              className={({ isActive }) => `flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors ${isActive ? 'bg-black/5 text-text-primary font-medium' : 'text-text-secondary hover:bg-black/5 hover:text-text-primary'}`}
            >
              <Icon size={16} className="shrink-0 opacity-70" />
              {label}
            </NavLink>
          ))}
        </div>
      ))}

      {/* User Context & Logout */}
      <div className="mt-auto p-4 border-t border-border">
        <div className="mb-3">
          <div className="mb-1">
            <RoleBadge role={user.role} />
          </div>
          <div className="text-text-muted text-xs font-mono overflow-hidden text-ellipsis whitespace-nowrap">
            {user.email}
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center justify-start gap-2 px-2 h-9 w-full rounded-md text-sm font-medium text-text-muted bg-transparent hover:bg-surface hover:text-text-primary transition-colors"
        >
          <LogOut size={16} className="opacity-70" />
          Log out
        </button>
      </div>
    </nav>
  );
}
