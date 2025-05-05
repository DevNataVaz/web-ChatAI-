import { useState, useEffect } from 'react';

import { useApp } from '../context/AppContext';


export const useNotifications = () => {
    const { notifications, user } = useApp();
    const [unreadCount, setUnreadCount] = useState(0);
  
    useEffect(() => {
      // Calculate unread notifications
      const unread = notifications.filter(n => !n.LIDA).length;
      setUnreadCount(unread);
    }, [notifications]);
  
    const markAsRead = async (notificationId) => {
      // Implementation for marking notification as read
      // This would need a new API endpoint
    };
  
    return {
      notifications,
      unreadCount,
      markAsRead
    };
  };
  