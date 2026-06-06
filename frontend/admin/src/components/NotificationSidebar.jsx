import React from 'react';
import { useNotification } from '../context/NotificationContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { X, CheckCheck, Bell, Info } from 'lucide-react';

// Native relative time formatter to avoid external dependencies
function formatRelativeTime(dateInput) {
  const diffInSeconds = Math.floor((new Date() - new Date(dateInput)) / 1000);
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export default function NotificationSidebar() {
  const { notifications, isSidebarOpen, closeSidebar, markAsRead } = useNotification();
  const { user } = useAuth();

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSidebar}
        style={{ backdropFilter: 'blur(2px)' }}
      ></div>

      {/* Sidebar Panel - Light theme strictly following design.md (#FAFAFA surface) */}
      <div className={`fixed right-0 top-0 h-screen w-80 bg-[#FAFAFA] border-l border-[#E5E5E5] z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-[#E5E5E5] bg-[#FFFFFF]">
          <div className="flex items-center gap-2 text-[#000000]">
            <Bell size={16} />
            <span className="text-sm font-semibold tracking-tight">Notifications</span>
          </div>
          <button 
            onClick={closeSidebar}
            className="text-[#737373] hover:text-[#000000] hover:bg-[#F0F0F0] p-1 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-[#737373] gap-2">
              <Bell size={24} className="opacity-20" />
              <span className="text-sm">No notifications yet</span>
            </div>
          ) : (
            <>
              {/* Unread Section */}
              {notifications.filter(n => !n.readBy.includes(user?.userId || user?._id || user?.id)).length > 0 && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider px-1">New</h3>
                  {notifications.filter(n => !n.readBy.includes(user?.userId || user?._id || user?.id)).map(notif => (
                    <div 
                      key={notif._id}
                      className="relative p-4 rounded-md border text-sm transition-all duration-200 bg-[#FFFFFF] border-[#D4D4D4] shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#0070F3] shrink-0"></div>
                            <h4 className="font-medium tracking-tight text-[#000000]">{notif.title}</h4>
                          </div>
                          
                          <p className="leading-relaxed text-[#525252]">{notif.message}</p>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-[11px] text-[#A3A3A3] font-mono">
                              {formatRelativeTime(notif.createdAt)}
                            </span>
                            {notif.type && (
                              <span className="text-[10px] font-semibold tracking-wider uppercase text-[#0070F3] bg-[#0070F3]/10 px-1.5 py-0.5 rounded-sm">
                                {notif.type.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>

                        <button 
                          onClick={() => markAsRead(notif._id)}
                          className="text-[#0070F3] hover:text-[#0761D1] hover:bg-[#0070F3]/10 p-1.5 rounded-md transition-colors flex-shrink-0"
                          title="Mark as read"
                        >
                          <CheckCheck size={14} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Read Section */}
              {notifications.filter(n => n.readBy.includes(user?.userId || user?._id || user?.id)).length > 0 && (
                <div className="flex flex-col gap-3 pt-2">
                  <h3 className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider px-1">Earlier</h3>
                  {notifications.filter(n => n.readBy.includes(user?.userId || user?._id || user?.id)).map(notif => (
                    <div 
                      key={notif._id}
                      className="relative p-4 rounded-md border text-sm transition-all duration-200 bg-[#F7F7F7] border-[#E5E5E5] opacity-60 hover:opacity-100"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-medium tracking-tight text-[#737373]">{notif.title}</h4>
                          </div>
                          
                          <p className="leading-relaxed text-[#A3A3A3] line-clamp-1">{notif.message}</p>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-[11px] text-[#A3A3A3] font-mono">
                              {formatRelativeTime(notif.createdAt)}
                            </span>
                            {notif.type && (
                              <span className="text-[10px] font-semibold tracking-wider uppercase text-[#0070F3] bg-[#0070F3]/10 px-1.5 py-0.5 rounded-sm">
                                {notif.type.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
