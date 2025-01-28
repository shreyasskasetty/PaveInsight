'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ResultData } from '@/types/resultData';
import { getSuperResolutionResult } from '@/lib/api/job-api';
import { fetchResultData, getRequestDetails } from '@/lib/api/request-api';
import { extractResultData } from '@/lib/utils/results';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Building, Phone, Download } from 'lucide-react';
import { fetchJobResult, fetchJobResultGeoJSON } from '@/app/api/fetchResults';
import { notification } from 'antd';
import { getJob } from '@/lib/api/job-api';
import { Person, Person2Outlined, PersonOutline } from '@mui/icons-material';

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
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [data, setData] = useState<ResultData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'map' | 'statistics' | 'summary'>('map');
    const [request, setRequest] = useState<any>(null);
    const [imageBounds, setImageBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);
    const [imageUrl, setImageUrl] = useState<string>('');
    const [downloadUrls, setDownloadUrls] = useState<{
        shapefile: string | null;
        superResolutionImage: string | null;
        superResolutionTif: string | null;
    }>({
        shapefile: null,
        superResolutionImage: null,
        superResolutionTif: null,
    });
    const fetchShapefileURL = async (requestId: string, jobId: string) => {
        try{
            const url = await fetchJobResult(requestId, parseInt(jobId));
            setDownloadUrls({
                shapefile: url.resultZippedShapefileS3URL,
                superResolutionImage: url.superResolutionImageS3URL,
                superResolutionTif: url.superResolutionTIFS3URL,
            });
        } catch(error: any) {
            console.log(error)
            throw error.response?.data || error.message
        }
    }

    const handleDownload = async (type: 'shapefile' | 'superResolutionImage' | 'superResolutionTif') => {
        setDownloadLoading(true);
        console.log(downloadUrls)
        try {
            const url = downloadUrls[type];
            if (!url) {
                notification.error({
                    message: 'Download Failed',
                    description: `No download URL was provided for the ${type}.`,
                });
                return;
            }

            const fileExtension = type === 'shapefile' ? 'zip' : 
                                type === 'superResolutionImage' ? 'jpg' : 'tif';
            
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_${requestId}_${jobId}.${fileExtension}`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err: any) {
            notification.error({
                message: 'Download Failed',
                description: `There was an error downloading the ${type}.`,
            });
            setError(`Failed to download ${type}`);
        } finally {
            setDownloadLoading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!requestId || !jobId) {
                    throw new Error('Request ID and Job ID are required');
                }
                const superResolutionData = await getSuperResolutionResult(requestId, parseInt(jobId));
                const requestInfo = await getRequestDetails(requestId);
                const responseData = await fetchJobResultGeoJSON(requestId, parseInt(jobId));
                const resultData = extractResultData(responseData);
                console.log(JSON.parse(superResolutionData.bounds))
                console.log(superResolutionData.superResolutionImageURL)
                setImageBounds(JSON.parse(superResolutionData.bounds));
                setImageUrl(superResolutionData.superResolutionURL);
                fetchShapefileURL(requestId, jobId);
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
                            {/* Left Section with Back Button and IDs */}
                            <div className="flex items-start">
                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    className="mr-4 hover:bg-gray-100"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <div>
                                    <h1 className="text-lg font-semibold text-gray-900 mb-2">Request Details</h1>
                                    <div className="flex space-x-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-gray-500">Request ID</span>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                #{requestId}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-gray-500">Job ID</span>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                #{jobId}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Section with User Details and Download Buttons */}
                            <div className="flex items-start space-x-8">
                                {request && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center text-gray-600">
                                                <PersonOutline className="h-4 w-4 mr-2" />
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-500">Name</span>
                                                    <span className="text-sm font-medium">{request.username}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center text-gray-600">
                                                <Mail className="h-4 w-4 mr-2" />
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-500">Email</span>
                                                    <span className="text-sm font-medium">{request.email}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center text-gray-600">
                                                <Building className="h-4 w-4 mr-2" />
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-500">Company</span>
                                                    <span className="text-sm font-medium">{request.companyName}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center text-gray-600">
                                                <Phone className="h-4 w-4 mr-2" />
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-500">Phone</span>
                                                    <span className="text-sm font-medium">{request.phoneNumber}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Download Buttons Section */}
                                <div className="flex flex-col space-y-2 min-w-[180px]">
                                    <Button
                                        onClick={() => handleDownload('shapefile')}
                                        disabled={downloadLoading}
                                        className="w-full justify-start"
                                        variant="outline"
                                    >
                                        {downloadLoading ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600 mr-2" />
                                        ) : (
                                            <Download className="h-4 w-4 mr-2" />
                                        )}
                                        Shapefile
                                    </Button>
                                    <Button
                                        onClick={() => handleDownload('superResolutionImage')}
                                        disabled={downloadLoading}
                                        className="w-full justify-start"
                                        variant="outline"
                                    >
                                        {downloadLoading ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600 mr-2" />
                                        ) : (
                                            <Download className="h-4 w-4 mr-2" />
                                        )}
                                        SR Image
                                    </Button>
                                    <Button
                                        onClick={() => handleDownload('superResolutionTif')}
                                        disabled={downloadLoading}
                                        className="w-full justify-start"
                                        variant="outline"
                                    >
                                        {downloadLoading ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600 mr-2" />
                                        ) : (
                                            <Download className="h-4 w-4 mr-2" />
                                        )}
                                        SR TIF
                                    </Button>
                                </div>
                            </div>
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
                    
                    <div className="p-6 relative min-h-[600px]">
                        {tabLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
                                <div className="flex flex-col items-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                                    <span className="text-sm text-gray-500">Loading...</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'map' && data?.mapData && <MapTab data={data.mapData} imageBounds={imageBounds} imageUrl={imageUrl} />}
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