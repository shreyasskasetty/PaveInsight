import axios from 'axios';

// New function to submit a job using the provided id
export const submitJob = async (id: string) => {
    try {
        const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_REQUESTS_API_URL}/${id}/submit-job`);
        return { status: response.status, data: response.data };
    } catch (error: any) {
        return { status: error.response?.status || 500, message: error.response?.data || error.message };
    }
}
