'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { JobDto } from '../api/fetchResults';
import { fetchFinalizedJob } from '../api/fetchResults';
import { ArrowLeft } from 'lucide-react';
import { getRequestDetails } from '@/lib/api/request-api';

const ResultsPage = () => {
    const router = useRouter();
    const [requestId, setRequestId] = useState('');
    const [emailId, setEmailId] = useState('');
    const [job, setJob] = useState<JobDto | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [request, setRequest] = useState<any | null>(null);
    function isValidUUID(uuid: string) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
    }

    const handleSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      
      try {
        const id = requestId;
        if (!isValidUUID(id)){
            throw new Error('Invalid Request ID');
        }
        const jobResult = await fetchFinalizedJob(id, emailId);
        const requestDetails = await getRequestDetails(id);
        setRequest(requestDetails)
        setJob(jobResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
      } finally {
        setLoading(false);
      }
    };
  

    const handleBack = () => {
        router.back();
    };

    const handleJobClick = (requestId: string, jobId: number) => {
      router.push(`results/${requestId}/job/${jobId}`);
    };
  
    return (
        <div className="container mx-auto p-4 max-w-2xl">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="container mx-auto p-4 max-w-2xl">
            <Card>
            <CardHeader>
                <h1 className="text-2xl font-bold text-center">Job Results Search</h1>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSearch} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">
                    Request ID
                    </label>
                    <Input
                    type="string"
                    value={requestId}
                    onChange={(e) => setRequestId(e.target.value)}
                    placeholder="Enter request ID"
                    required
                    className="w-full"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">
                   Email ID
                    </label>
                    <Input
                    type="string"
                    value={emailId}
                    onChange={(e) => setEmailId(e.target.value)}
                    placeholder="Enter email ID"
                    required
                    className="w-full"
                    />
                </div>
                <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loading}
                >
                    {loading ? 'Searching...' : 'Search Jobs'}
                </Button>
                </form>
    
                {error && (
                <Alert variant="destructive" className="mt-4">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                )}
    
                {job && request && (
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-3">Available Jobs</h2>
                    <div className="space-y-2">
                        <div
                        key={job.id}
                        onClick={() => handleJobClick(requestId, job.id)}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                        {/* <div className="font-medium">Job ID: {job.id}</div> */}
                        <div className="text-sm text-gray-600">Name: {request.username}</div>
                        <div className="text-sm text-gray-600">Email: {request.email}</div>
                        <div className="text-sm text-gray-600">Company Name: {request.companyName}</div>
                        <div className="text-sm text-gray-600">Status: {job.status}</div>
                        <div className="text-sm text-gray-600">
                            Created: {new Date(job.createdAt).toLocaleString()}
                        </div>
                        {job.satelliteImageURL && (
                            <div className="text-sm text-gray-600">
                            Satellite Image Available
                            </div>
                        )}
                        </div>
                    </div>
                </div>
                )}
            </CardContent>
            </Card>
        </div>
    </div>
    );
};

export default ResultsPage;