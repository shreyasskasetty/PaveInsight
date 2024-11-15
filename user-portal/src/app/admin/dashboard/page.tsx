'use client'
import { getCompletedRequestCount, getPendingRequestCount, getTotalRequestCount } from '@/lib/api/request-api';
import { request } from 'http';
import React, { useEffect, useState } from 'react';
import {FiUsers, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';


export default function asyncDashboard() {
  const [totalRequests, setTotalRequests] = useState<number>(0);
  const [pendingRequestCount, setPendingRequestCount] = useState<number>(0);
  const [completedRequestCount, setCompletedRequestCount] = useState<number>(0);
  const [jobsCountInQueue, setJobCountInQueue] = useState<number>(0);
  
  useEffect(()=>{
    const totalRequestcount = async () => {
      const requestTotalCount = await getTotalRequestCount();
      const requestPendingCount = await getPendingRequestCount();
      const requestCompletedtCount = await getCompletedRequestCount();
      //Note: call the api to get the ML Job Total count in Queue and set the state variable
      setPendingRequestCount(requestPendingCount);
      setCompletedRequestCount(requestCompletedtCount)
      setTotalRequests(requestTotalCount);

    }
    totalRequestcount();
  },[])
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
              <p className="text-3xl font-bold">{totalRequests}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Pending Requests</h3>
                <FiClock className="text-yellow-500" size={24} />
              </div>
              <p className="text-3xl font-bold">{pendingRequestCount}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Completed Requests</h3>
                <FiCheckCircle className="text-green-500" size={24} />
              </div>
              <p className="text-3xl font-bold">{completedRequestCount}</p>
            </div>

            {/* ML Pipeline Monitoring */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">ML Jobs in Queue</h3>
                <FiAlertCircle className="text-orange-500" size={24} />
              </div>
              <p className="text-3xl font-bold">{jobsCountInQueue}</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
