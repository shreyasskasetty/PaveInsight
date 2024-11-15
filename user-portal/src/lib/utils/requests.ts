export const getRequestStatusString = (status: string)=>{
    switch(status){
      case 'PENDING':
        return 'Pending';
      case 'IN PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      default: 
        return "N/A"
    }
  }