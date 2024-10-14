'use client'
import React from 'react';
import {FiUsers, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex flex-col flex-1">
        {/* Main content */}
        <main className="flex-1 p-6">
          <h2 className="text-2xl font-semibold mb-6">Dashboard Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Service Request Statistics */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Total Requests</h3>
                <FiUsers className="text-blue-500" size={24} />
              </div>
              <p className="text-3xl font-bold">1,234</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Pending Requests</h3>
                <FiClock className="text-yellow-500" size={24} />
              </div>
              <p className="text-3xl font-bold">56</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Completed Requests</h3>
                <FiCheckCircle className="text-green-500" size={24} />
              </div>
              <p className="text-3xl font-bold">1,178</p>
            </div>

            {/* ML Pipeline Monitoring */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">ML Jobs in Queue</h3>
                <FiAlertCircle className="text-orange-500" size={24} />
              </div>
              <p className="text-3xl font-bold">12</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
