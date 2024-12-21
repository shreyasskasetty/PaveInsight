// lib/api/api-service.ts
import axios from 'axios';
import { request } from 'http';

export interface JobDto {
  id: number;
  status: string;
  resultData: string;
  satelliteImageURL: string;
  createdAt: Date;
  updatedAt: Date;
  requestId: number;
  geoJson: string;
  jobs?: JobDto[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_REQUESTS_API_URL || 'http://localhost:8080';

export const fetchFinalizedJob = async (requestId: string, emailId: string): Promise<JobDto> => {
  try {
    const response = await axios.post<JobDto>(`${API_BASE_URL}/${requestId}/finalized-job`, {emailId});
    console.log(response)
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to fetch job results');
    }
    throw error;
  }
};

export const fetchJobResult = async (requestId: string, jobId: number): Promise<string> => {
  try {
    const response = await axios.get<string>(`${API_BASE_URL}/${requestId}/job/${jobId}/result`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to fetch job result');
    }
    throw error;
  }
}