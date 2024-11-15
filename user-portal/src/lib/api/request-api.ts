import axios from 'axios';


// Define the interface for the data structure
interface SubmitFormData {
    username: string;
    email: string;
    companyName: string | null;
    phoneNumber: string;
    geoJson: string;
    message: string;
  }
  

  
// Update the function to use the defined interface
export const getRequests = async () => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REQUESTS_API_URL}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

// Update the function to use the defined interface
export const submitForm = async (data: SubmitFormData) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_REQUESTS_API_URL}`, data);
      console.log(response)
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  };

export const deleteRequest = async(id: string) => {
    try {
        const response = await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_REQUESTS_API_URL}/${id}`)
        return response.data;
    } catch (error: any){
        throw error.response?.data || error.message;
    }
}

export const getRequestDetails = async(id: string) => {
    try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REQUESTS_API_URL}/${id}`)
        return response.data;
    } catch (error: any){
        throw error.response?.data || error.message;
    }
}

export const updateRequestStatus = async(id: string, value: string) => {
    try {
        const response = await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_REQUESTS_API_URL}/${id}`, { status: value });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
}

export const getPendingRequestCount = async()=> {
    try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REQUESTS_API_URL}/count/pending`);
        return response.data;
    }catch(error: any){
        throw error.response?.data || error.message;
    }
}

export const getTotalRequestCount = async()=>{
    try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REQUESTS_API_URL}/count/total`);
        return response.data;
    }catch(error: any){
        throw error.response?.data || error.message
    }
}

export const getCompletedRequestCount = async()=>{
    try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_REQUESTS_API_URL}/count/completed`);
        return response.data;
    }catch(error: any){
        throw error.response?.data || error.message
    }
}
