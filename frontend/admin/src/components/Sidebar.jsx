import React, { useState } from 'react';
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
  LogOut,
  Sparkles,
  Edit,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';

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
      { to: '/sdrd',                 label: 'SDRD Dashboard',        icon: BarChart },
      { to: '/sdrd/ai-builder',      label: 'AI Survey Builder',     icon: Sparkles },
      { to: '/sdrd/manual-builder',  label: 'Manual Survey Builder', icon: Edit },
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
  const toast = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  const sections = NAV[user.role] || [];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.info('You have been logged out');
      navigate('/login');
    } catch (error) {
      console.error(error);
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className={`shrink-0 border-r border-border bg-surface-alt flex flex-col sticky top-0 h-screen transition-[width] duration-300 ease-in-out z-50 relative ${isCollapsed ? 'w-[72px]' : 'w-64'}`}>
      
      {/* Floating Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-6 z-50 flex items-center justify-center w-7 h-7 bg-white border border-border rounded-full shadow-sm text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
        title={isCollapsed ? "Expand" : "Collapse"}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Header / Logo Area */}
      <div className={`flex items-center h-16 px-5 border-b border-border shrink-0 overflow-hidden ${isCollapsed ? 'justify-center px-0' : 'gap-3'}`}>
        <div className="bg-text-primary text-bg w-8 h-8 flex items-center justify-center rounded font-bold text-sm shrink-0">N</div>
        
        <div className={`flex flex-col justify-center transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'}`}>
          <div className="font-bold text-[15px] tracking-tight leading-none">NARAD</div>
          <div className="text-[10px] text-text-muted uppercase tracking-wider mt-[3px]">MoSPI</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-3">
        {sections.map(({ section, links }) => (
          <div key={section} className="flex flex-col gap-1 px-3 mb-5">
            {!isCollapsed && <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1 px-2 overflow-hidden whitespace-nowrap">{section}</div>}
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/admin/users' || to === '/sdrd' || to === '/fod' || to === '/dpd' || to === '/cqcd'}
                title={isCollapsed ? label : undefined}
                className={({ isActive }) => `relative flex items-center rounded-lg transition-all ${isCollapsed ? 'flex-col justify-center h-[64px] px-1 py-2 gap-1 mx-auto w-full' : 'gap-4 px-3 h-10'} ${isActive ? 'bg-black/5 text-text-primary font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-[20px] before:bg-text-primary before:rounded-r-md' : 'text-text-secondary hover:bg-black/5 hover:text-text-primary'}`}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={isCollapsed ? 22 : 18} className={`shrink-0 transition-all ${isActive ? 'text-text-primary' : 'opacity-70'}`} />
                    {isCollapsed ? (
                      <span className="text-[10px] font-medium leading-tight truncate w-full text-center opacity-80">{label.split(' ')[0]}</span>
                    ) : (
                      <span className="text-[14px] truncate">{label}</span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
        </div>
      ))}
        </div>

      {/* User Context & Actions */}
      <div className="mt-auto border-t border-border bg-surface-alt shrink-0">
        <div className={`p-4 flex flex-col gap-3 transition-all ${isCollapsed ? 'items-center px-2' : ''}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="shrink-0">
                <RoleBadge role={user.role} />
              </div>
              <div className="text-text-muted text-xs font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                {user.email}
              </div>
            </div>
          )}
          
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            title={isCollapsed ? "Log out" : undefined}
            className={`flex items-center rounded-lg text-sm font-medium text-geist-error/80 hover:bg-geist-error/10 hover:text-geist-error transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isCollapsed ? 'flex-col justify-center h-[56px] w-full px-1 py-2 gap-1' : 'justify-start gap-3 px-3 h-10 w-full'}`}
          >
            {isLoggingOut ? (
              <Loader2 size={isCollapsed ? 20 : 18} className="opacity-70 animate-spin shrink-0" />
            ) : (
              <LogOut size={isCollapsed ? 20 : 18} className="opacity-80 shrink-0" />
            )}
            {isCollapsed ? (
              <span className="text-[10px] font-medium truncate w-full text-center leading-tight">Exit</span>
            ) : (
              <span className="truncate">{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
