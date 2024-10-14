'use client'
import React from 'react';
import {Sidebar} from '@/app/ui/dashboard/sidebar' 
import Header from '@/app/ui/dashboard/header';

interface LayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />
      <div className="flex flex-col flex-1">
      <Header />
      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
