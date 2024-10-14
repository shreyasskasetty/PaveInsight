import React from 'react';
import Link from 'next/link';
import { FiHome, FiMap, FiCheckSquare, FiBell, FiSettings } from 'react-icons/fi';

interface SidebarOption {
  href: string;
  icon: React.ElementType;
  label: string;
}

interface SidebarProps {
  options?: SidebarOption[];
}

const defaultOptions: SidebarOption[] = [
  { href: '/admin/dashboard', icon: FiHome, label: 'Dashboard' },
  { href: '/', icon: FiMap, label: 'Map' },
  { href: '/admin/dashboard/requests', icon: FiCheckSquare, label: 'Requests' },
  { href: '/admin/dashboard/notifications', icon: FiBell, label: 'Notifications' },
  { href: '/admin/dashboard/settings', icon: FiSettings, label: 'Settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({ options = defaultOptions }) => {
  return (
    <aside className="w-52 bg-[#2A2A2D] shadow-md h-screen">
      <nav className="mt-5">
        {options.map((option, index) => (
          <Link 
            key={index} 
            href={option.href} 
            className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700"
          >
            <option.icon className="mr-3" /> {option.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;