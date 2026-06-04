import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';
import client from '../api/client.js';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const toast = useToast();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  const fetchInitialNotifications = useCallback(async () => {
    if (!user) return;
    try {
      // Use client to automatically send cookies
      const response = await client.get('/notifications');
      if (response.data) {
        const data = response.data.data || [];
        const unread = response.data.unreadCount || 0;
        
        setNotifications(data);
        setUnreadCount(unread);
        
        // Pop toast on login/load if there are unread items, but only once per session
        if (unread > 0 && !sessionStorage.getItem('loginToastShown')) {
          toast.info(`You have ${unread} unread notifications`);
          sessionStorage.setItem('loginToastShown', 'true');
        }
        
        setLastFetchTime(Date.now());
      }
    } catch (error) {
      console.error('Failed to fetch initial notifications', error);
    }
  }, [user]);

  // Setup SSE stream
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    
    // Initial historical fetch
    fetchInitialNotifications();

    // Establish SSE Connection with credentials so it sends the JWT cookie
    const eventSource = new EventSource(`http://localhost:3000/api/notifications/stream`, { withCredentials: true });

    eventSource.onmessage = (event) => {
      // The server sends a heartbeat 'connected' event first
      if (event.data === 'connected') return;

      try {
        const newNotification = JSON.parse(event.data);
        
        // Prevent duplicates just in case
        setNotifications(prev => {
          if (prev.some(n => n._id === newNotification._id)) return prev;
          
          // Trigger Toast for new notification
          toast.info(`New Notification: ${newNotification.title}`);
          
          // Prepend to list
          return [newNotification, ...prev];
        });

        // Increment unread count
        setUnreadCount(prev => prev + 1);
        
      } catch (error) {
        console.error('Error parsing SSE notification:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      // EventSource auto-reconnects natively, so we just log it.
    };

    return () => {
      eventSource.close();
    };
  }, [user, fetchInitialNotifications, toast]);

  const markAsRead = async (notificationId) => {
    try {
      const uid = user?.userId || user?._id;
      // Optimistic update
      setNotifications(prev => prev.map(n => {
        if (n._id === notificationId && !n.readBy.includes(uid)) {
          return { ...n, readBy: [...n.readBy, uid] };
        }
        return n;
      }));
      setUnreadCount(prev => Math.max(0, prev - 1));

      await client.post(`/notifications/read/${notificationId}`);
    } catch (error) {
      console.error('Failed to mark notification as read', error);
      fetchInitialNotifications(); // Revert on failure
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isSidebarOpen,
      toggleSidebar,
      closeSidebar,
      markAsRead,
      fetchInitialNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};
