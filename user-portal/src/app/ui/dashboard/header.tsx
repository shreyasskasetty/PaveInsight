import React from 'react';
import { FiBell, FiUser, FiLogOut } from 'react-icons/fi';
import { signOut } from 'next-auth/react';

const Header: React.FC = () => {
  return (
    <header className="flex justify-between items-center p-3 bg-[#2A2A2D] text-white shadow-sm mx-4 my-2 rounded-lg">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="flex items-center">
        <button className="mr-4 text-white hover:text-gray-300">
          <FiBell size={20} />
        </button>
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