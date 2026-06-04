import React from 'react';
import { Bell } from 'lucide-react';
import { useNotification } from '../context/NotificationContext.jsx';
import NotificationSidebar from './NotificationSidebar.jsx';

export default function TopBar({ title }) {
  const { unreadCount, toggleSidebar } = useNotification();

  return (
    <>
      <div className="h-14 flex items-center justify-between px-6 border-b border-border bg-bg sticky top-0 z-10">
        <div className="flex items-center">
          <span className="text-sm font-medium text-text-primary">{title}</span>
        </div>
        
        {/* Right side actions */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="relative p-1.5 text-text-secondary hover:text-text-primary hover:bg-black/5 rounded-md transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 flex items-center justify-center min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border border-bg shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Sidebar Overlay */}
      <NotificationSidebar />
    </>
  );
}
