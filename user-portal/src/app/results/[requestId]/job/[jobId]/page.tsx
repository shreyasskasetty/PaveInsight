'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ResultData } from '@/types/resultData';
import { fetchResultData, getRequestDetails } from '@/lib/api/request-api';
import { extractResultData } from '@/lib/utils/results';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Building, Phone } from 'lucide-react';
import { fetchJobResult } from '@/app/api/fetchResults';

// Dynamically import components (avoid SSR rendering issues)
const MapTab = dynamic(() => import('../../../../ui/resultTabs/MapTab'), { ssr: false });
const StatisticsTab = dynamic(() => import('../../../../ui/resultTabs/StatisticsTab'), { ssr: false });
const SummaryTable = dynamic(() => import('../../../../ui/resultTabs/ConditionSummaryTab'), { ssr: false });

const ResultsPage: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const requestId = params.requestId as string;
    const jobId = params.jobId as string;
    
    const [loading, setLoading] = useState(true);
    const [tabLoading, setTabLoading] = useState(false);
    const [data, setData] = useState<ResultData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'map' | 'statistics' | 'summary'>('map');
    const [request, setRequest] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!requestId || !jobId) {
                    throw new Error('Request ID and Job ID are required');
                }
                const requestInfo = await getRequestDetails(requestId);
                const responseData = await fetchJobResult(requestId, parseInt(jobId));
                const resultData = extractResultData(responseData);
                setData(resultData);
                setActiveTab('map');
                setRequest(requestInfo);
            } catch (err: any) {
                setError(err.message || 'Something went wrong');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [requestId, jobId]);

    const handleTabChange = async (tab: 'map' | 'statistics' | 'summary') => {
        setTabLoading(true);
        setActiveTab(tab);
        // Simulate loading for smoother transition
        await new Promise(resolve => setTimeout(resolve, 300));
        setTabLoading(false);
    };

    const handleBack = () => {
        router.back();
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    if (error) return (
        <div className="p-4">
            <Button
                variant="ghost"
                onClick={handleBack}
                className="flex items-center gap-2 hover:bg-gray-100 mb-4"
            >
                <ArrowLeft className="h-4 w-4" />
                Back
            </Button>
            <div className="text-red-500 text-center">Error: {error}</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto">
                    <div className="py-6 px-4 sm:px-6 lg:px-8">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start">
                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    className="mr-4 hover:bg-gray-100"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h2 className="text-sm font-medium text-gray-500">
                                            Request
                                        </h2>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            #{requestId}
                                        </span>
                                    </div>
                                    <div className="flex items-center mt-1 space-x-2">
                                        <h2 className="text-sm font-medium text-gray-500">
                                            Job
                                        </h2>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            #{jobId}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {request && (
                                <div className="text-sm space-y-2">
                                    <div className="flex items-center text-gray-600">
                                        <Mail className="h-4 w-4 mr-2" />
                                        <span>{request.email}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <Building className="h-4 w-4 mr-2" />
                                        <span>{request.companyName}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <Phone className="h-4 w-4 mr-2" />
                                        <span>{request.phoneNumber}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="bg-white rounded-lg shadow-md">
                    <div className="border-b">
                        <div className="flex">
                            <button
                                className={`px-6 py-4 text-sm font-medium transition-all duration-200 border-b-2 hover:text-blue-600 hover:border-blue-300 ${
                                    activeTab === 'map' 
                                        ? 'border-blue-500 text-blue-600' 
                                        : 'border-transparent text-gray-500'
                                }`}
                                onClick={() => handleTabChange('map')}
                            >
                                Map View
                            </button>
                            <button
                                className={`px-6 py-4 text-sm font-medium transition-all duration-200 border-b-2 hover:text-blue-600 hover:border-blue-300 ${
                                    activeTab === 'statistics' 
                                        ? 'border-blue-500 text-blue-600' 
                                        : 'border-transparent text-gray-500'
                                }`}
                                onClick={() => handleTabChange('statistics')}
                            >
                                Statistics
                            </button>
                            <button
                                className={`px-6 py-4 text-sm font-medium transition-all duration-200 border-b-2 hover:text-blue-600 hover:border-blue-300 ${
                                    activeTab === 'summary' 
                                        ? 'border-blue-500 text-blue-600' 
                                        : 'border-transparent text-gray-500'
                                }`}
                                onClick={() => handleTabChange('summary')}
                            >
                                Summary
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-6 relative min-h-[500px]">
                        {tabLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
                                <div className="flex flex-col items-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                                    <span className="text-sm text-gray-500">Loading...</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'map' && data?.mapData && <MapTab data={data.mapData} />}
                                {activeTab === 'statistics' && data?.statistics && <StatisticsTab data={data.statistics} />}
                                {activeTab === 'summary' && data?.summary && <SummaryTable data={data.summary} />}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultsPage;