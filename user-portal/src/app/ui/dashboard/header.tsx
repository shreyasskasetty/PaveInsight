import React, { useState, useEffect } from 'react';
import { FiBell, FiUser, FiLogOut, FiCheck, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { signOut } from 'next-auth/react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Button
} from "@/components/ui/button"
import {
  Badge
} from "@/components/ui/badge"

type JobStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

type Notification = {
  id: number;
  jobId: string;
  requestId: string;
  status: JobStatus;
  message: string;
  timestamp: string;
  read: boolean;
}

const STORAGE_KEY = 'dashboard_notifications';

// ... (previous helper functions remain the same)
const getStatusIcon = (status: JobStatus) => {
  switch (status) {
    case 'PENDING':
      return <FiClock className="h-4 w-4 text-yellow-500" />;
    case 'IN_PROGRESS':
      return <FiClock className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'COMPLETED':
      return <FiCheckCircle className="h-4 w-4 text-green-500" />;
    case 'FAILED':
      return <FiAlertCircle className="h-4 w-4 text-red-500" />;
  }
};

const getStatusColor = (status: JobStatus) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-50 hover:bg-yellow-100';
    case 'IN_PROGRESS':
      return 'bg-blue-50 hover:bg-blue-100';
    case 'COMPLETED':
      return 'bg-green-50 hover:bg-green-100';
    case 'FAILED':
      return 'bg-red-50 hover:bg-red-100';
  }
};

const Header = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stompClient, setStompClient] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load notifications from localStorage
  useEffect(() => {
    const loadNotifications = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsedNotifications = JSON.parse(saved);
          setNotifications(parsedNotifications);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
      setIsLoaded(true);
    };

    loadNotifications();
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    if (isLoaded) {
      if (notifications.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [notifications, isLoaded]);

  // Update or add new notification
  const updateNotifications = (jobUpdate: any) => {
    const newNotification = {
      id: Date.now(),
      jobId: jobUpdate.jobId || 'Unknown',
      requestId: jobUpdate.requestId || 'Unknown',
      status: jobUpdate.status || 'PENDING',
      message: jobUpdate.message || 'No message provided',
      timestamp: new Date().toLocaleTimeString(),
      read: false
    };

    setNotifications(prev => {
      // Remove any existing notification with the same jobId and requestId
      const filteredNotifications = prev.filter(notification => 
        !(notification.jobId === newNotification.jobId && 
          notification.requestId === newNotification.requestId)
      );
      
      // Add the new notification
      const updated = [...filteredNotifications, newNotification];
      
      // Sort by timestamp (newest first) and limit to max notifications
      const maxNotifications = 50;
      return updated
        .sort((a, b) => b.id - a.id)
        .slice(0, maxNotifications);
    });
  };

  useEffect(() => {
    if (!isLoaded) return;

    const socket = new SockJS('http://localhost:8080/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log('Connected to WebSocket');
      
      client.subscribe('/all/messages', (message) => {
        try {
          const jobUpdate = JSON.parse(message.body);
          updateNotifications(jobUpdate);
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      });
    };

    client.onStompError = (frame) => {
      console.error('STOMP error:', frame);
    };

    client.activate();
    setStompClient(client);

    return () => {
      if (client.active) {
        client.deactivate();
      }
    };
  }, [isLoaded]);

  // Clean up old notifications
  useEffect(() => {
    if (!isLoaded) return;

    const cleanup = () => {
      const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
      setNotifications(prev => 
        prev.filter(notification => notification.id > twentyFourHoursAgo)
      );
    };

    const interval = setInterval(cleanup, 60 * 60 * 1000);
    cleanup();

    return () => clearInterval(interval);
  }, [isLoaded]);

  const markAsRead = (id: number) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== id)
    );
  };

  const markAllAsRead = () => {
    setNotifications([]);
  };

  // Only render notification count after hydration
  const notificationCount = isLoaded ? notifications.length : 0;

  return (
    // ... (rest of the JSX remains the same)
    <header className="relative flex justify-between items-center p-3 bg-gray-900 text-white shadow-md mx-4 my-2 rounded-lg">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="flex items-center">
        <div className="relative">
          <button 
            className="mr-4 text-white hover:text-gray-300 relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <FiBell size={20} />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full">
                {notificationCount > 1 && (
                  <span className="absolute -right-3 -top-3 bg-red-500 rounded-full px-1.5 py-0.5 text-xs">
                    {notificationCount}
                  </span>
                )}
              </span>
            )}
          </button>

          {showNotifications && isLoaded && (
            <Card className="absolute right-0 mt-2 w-96 z-50">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Job Updates</h2>
                <Badge variant="secondary">{notificationCount} new</Badge>
              </div>
              <CardContent className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No active jobs</p>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg transition-colors ${getStatusColor(notification.status)}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusIcon(notification.status)}
                              <Badge variant="outline" className="text-xs">
                                {notification.status}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-500">Job ID:</span>
                                <code className="text-xs bg-white bg-opacity-50 px-1 py-0.5 rounded">
                                  {notification.jobId}
                                </code>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-500">Request ID:</span>
                                <code className="text-xs bg-white bg-opacity-50 px-1 py-0.5 rounded">
                                  {notification.requestId}
                                </code>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{notification.message}</p>
                            <span className="text-xs text-gray-500 block mt-2">{notification.timestamp}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="ml-2 hover:bg-white hover:bg-opacity-20"
                          >
                            <FiCheck className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                    className="w-full"
                  >
                    Clear all notifications
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
        <button className="mr-4 text-white hover:text-gray-300">
          <FiUser size={20} />
        </button>
        <button
          className="text-white hover:text-gray-300"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <FiLogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;