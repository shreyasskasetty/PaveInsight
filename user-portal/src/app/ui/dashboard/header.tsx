import React, { useState, useEffect } from 'react';
import { FiBell, FiUser, FiLogOut, FiCheck } from 'react-icons/fi';
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

type Notification = {
  id: number;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const Header = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stompClient, setStompClient] = useState<any>(null);

  useEffect(() => {
    // Initialize WebSocket connection
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
      
      // Subscribe to notifications
      client.subscribe('/all/messages', (message) => {
        try {
          const notification = JSON.parse(message.body);
          setNotifications(prev => [...prev, {
            id: Date.now(), // Use timestamp as temporary ID
            title: notification.title || "New Notification",
            description: notification.text,
            time: "Just now",
            read: false
          }]);
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

    // Cleanup on component unmount
    return () => {
      if (client.active) {
        client.deactivate();
      }
    };
  }, []);

  const markAsRead = (id: number) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== id)
    );
  };

  const markAllAsRead = () => {
    setNotifications([]);
  };

  return (
    <header className="relative flex justify-between items-center p-3 bg-gray-900 text-white shadow-md mx-4 my-2 rounded-lg">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="flex items-center">
        <div className="relative">
          <button 
            className="mr-4 text-white hover:text-gray-300 relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <FiBell size={20} />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full">
                {notifications.length > 1 && (
                  <span className="absolute -right-3 -top-3 bg-red-500 rounded-full px-1.5 py-0.5 text-xs">
                    {notifications.length}
                  </span>
                )}
              </span>
            )}
          </button>

          {showNotifications && (
            <Card className="absolute right-0 mt-2 w-80 z-50">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                <span className="text-sm text-gray-500">{notifications.length} new</span>
              </div>
              <CardContent className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No notifications</p>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{notification.title}</h3>
                            <p className="text-sm text-gray-600">{notification.description}</p>
                            <span className="text-xs text-gray-500">{notification.time}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="ml-2 hover:bg-blue-200"
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