'use client'
import React from 'react';
import Link from 'next/link';
import { FiSettings, FiCheckSquare, FiHome, FiBell, FiUser, FiLogOut } from 'react-icons/fi';
import { signOut } from 'next-auth/react';
export default function Dashboard() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <nav className="mt-5">
          <Link href="/admin/dashboard" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <FiHome className="mr-3" /> Dashboard
          </Link>
          <Link href="/admin/completed-requests" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <FiCheckSquare className="mr-3" /> Completed Requests
          </Link>
          <Link href="/admin/notifications" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <FiBell className="mr-3" /> Notifications
          </Link>
          <Link href="/admin/settings" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
            <FiSettings className="mr-3" /> Settings
          </Link>
        </nav>
      </aside>

      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="flex justify-between items-center p-4 bg-white shadow-sm">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="flex items-center">
            <button className="mr-4 text-gray-600 hover:text-gray-800">
              <FiBell size={20} />
            </button>
            <button className="mr-4 text-gray-600 hover:text-gray-800">
              <FiUser size={20} />
            </button>
            <button className="text-gray-600 hover:text-gray-800"
             onClick={() => signOut({ callbackUrl: '/' })}>
              <FiLogOut size={20} />
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6">
          {/* Add your dashboard content here */}
          <p>Welcome to the Admin Dashboard</p>
        </main>
      </div>
    </div>
  );
}
