import axios from "axios";

const BASE_API_URL = process.env.NEXT_PUBLIC_BACKEND_REQUESTS_API_URL;

export const deleteJob = async (requestId: string, jobId: number) =>{
    try{
        const response = await axios.delete(`${BASE_API_URL}/${requestId}/job/${jobId}/delete`);
        console.log(response)
        return response;
    } catch(error: any) {
        console.log(error)
        throw error.response?.data || error.message;
    }
}

export const getJob = async (requestId: string, jobId: number) =>{
    try{
        const response = await axios.get(`${BASE_API_URL}/${requestId}/job/${jobId}`);
        console.log(response)
        return response;
    } catch(error: any) {
        console.log(error)
        throw error.response?.data || error.message;
    }
}

export const finalizeJob = async (requestId: string, jobId: number) =>{
    try{
        const response = await axios.post(`${BASE_API_URL}/${requestId}/job/${jobId}/finalize`);
        return response;
    } catch(error: any) {
        throw error.response?.data || error.message;
    }
}

export const resetFinalizedJob = async (requestId: string, jobId: number) =>{
    try{
        const response = await axios.post(`${BASE_API_URL}/${requestId}/job/${jobId}/reset-finalize`)
        return response;
    } catch(error: any) {
        throw error.response?.data || error.message;
    }
}

// New function to submit a job using the provided id
export const submitJob = async (id: string) => {
    try {
        const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_REQUESTS_API_URL}/${id}/submit-job`);
        return { status: response.status, data: response.data };
    } catch (error: any) {
        return { status: error.response?.status || 500, message: error.response?.data || error.message };
    }
}

export const getSuperResolutionResult = async(requestId: string, jobId: number) => {
    try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REQUESTS_API_URL}/${requestId}/job/${jobId}/sri-result`);
        return response.data;
    } catch (error: any){
        throw error.response?.data || error.message;
    }
}