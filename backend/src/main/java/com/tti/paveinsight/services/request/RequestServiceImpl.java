package com.tti.paveinsight.services.request;

import com.tti.paveinsight.dto.JobDto;
import com.tti.paveinsight.dto.RequestDto;
import com.tti.paveinsight.dto.SuperResolutionDto;
import com.tti.paveinsight.models.Job;
import com.tti.paveinsight.models.Request;
import com.tti.paveinsight.repositories.JobRepository;
import com.tti.paveinsight.repositories.RequestRepository;
import com.tti.paveinsight.services.job.JobServiceImpl;
import com.tti.paveinsight.utils.JobUtils;
import com.tti.paveinsight.utils.RequestUtils;
import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class RequestServiceImpl implements RequestService{
    private final RequestRepository requestRepository;
    private final JobRepository jobRepository;
    private final JobServiceImpl jobServiceImpl;
    private final RequestUtils requestUtils;
    private final JobUtils jobUtils;

    public List<RequestDto> getAllRequests() {
        return requestRepository.findAll().stream()
                .map(request -> {
                    List<JobDto> jobDtos = request.getJobs().stream().map(j -> jobUtils.convertToDto(request, j)).toList();
                    return new RequestDto(
                            request.getId(), request.getUsername(), request.getEmail(), request.getCompanyName(),
                            request.getPhoneNumber(), request.getGeoJson(), request.getMessage(), request.getStatus(),
                            request.getUpdatedAt(), request.getCreatedAt(),
                            jobDtos);
                }).collect(Collectors.toList());
    }


    public RequestDto createRequest(RequestDto requestDto) {
        Request request = new Request();
        request.setUsername(requestDto.getUsername());
        request.setEmail(requestDto.getEmail());
        request.setGeoJson(requestDto.getGeoJson());
        request.setCompanyName(requestDto.getCompanyName());
        request.setPhoneNumber(requestDto.getPhoneNumber());
        request.setMessage(requestDto.getMessage());
        request.setStatus("PENDING");
        request = requestRepository.save(request);
        return requestUtils.convertToDto(request, null);
    }

    public long getTotalRequestCount(){
        return requestRepository.count();
    }

    public long getPendingRequestCount(){
        return requestRepository.countByStatus("PENDING");
    }

    public long getCompletedRequestCount(){
        return requestRepository.countByStatus("COMPLETED");
    }

    public RequestDto getRequestById(UUID id) {
        Request request = requestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Request not found with id: " + id));

        // Fetch all jobs associated with the request
        List<Job> jobs = request.getJobs();

        // Prepare a list of job DTOs
        List<JobDto> jobDtos = jobs.stream().map(job -> jobUtils.convertToDto(request, job)).toList();

        return new RequestDto(
                request.getId(),
                request.getUsername(),
                request.getEmail(),
                request.getCompanyName(),
                request.getPhoneNumber(),
                request.getGeoJson(),
                request.getMessage(),
                request.getStatus(),
                request.getUpdatedAt(),
                request.getCreatedAt(),
                jobDtos  // Include the list of job DTOs
        );
    }

    public void deleteRequestById(UUID id) {
        if (requestRepository.existsById(id)) {
            requestRepository.deleteById(id);
        } else {
            throw new IllegalArgumentException("Request not found with id: " + id);
        }
    }

    public RequestDto submitJobForRequest(UUID requestId) {
        // Retrieve the request by ID
        Request request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found with ID: " + requestId));

        System.out.println(request.getGeoJson());
        // Check if a job is already linked to this request
//        if (request.getJobId() != null) {
//            throw new IllegalArgumentException("Job is already linked to this request with job ID: " + request.getJobId());
//        }

        // Create a new Job and link it to the request
        Job job = new Job();

        job.setRequest(request);
        job.setStatus("PENDING");

        job = jobRepository.save(job); // Save the job to get a generated job ID

        // Link the job to the request by updating jobId in the Request entity
        request.addJob(job);
        requestRepository.save(request);

        // Convert job to JobDto (if JobDto exists) or use job.getId() for reference
        JobDto jobDto = new JobDto(
                job.getId(),
                job.getStatus(),
                job.getResultData(),
                job.getResultGeoJsonData(),
                job.getSatelliteImageURL(),
                job.getCreatedAt(),
                job.getUpdatedAt(),
                job.isResultFinalized(),
                request.getId(),       // requestId from the associated request
                request.getGeoJson()    // geoJson from the associated request
        );

        // Publish the job to RabbitMQ for processing
        jobServiceImpl.submitJobAsync(jobDto);

        List<JobDto> jobDtos = request.getJobs().stream().map(j -> jobUtils.convertToDto(request, j)).toList();

        // Convert the updated request to RequestDto and return
        return requestUtils.convertToDto(request, jobDtos);
    }


    public RequestDto updateRequest(UUID id, RequestDto requestDto){
        // Retrieve the existing request
        Request request = requestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Request not found with id: " + id));
        
        // Update the request fields only if they are not null
        if (requestDto.getUsername() != null) {
            request.setUsername(requestDto.getUsername());
        }
        if (requestDto.getEmail() != null) {
            request.setEmail(requestDto.getEmail());
        }
        if (requestDto.getGeoJson() != null) {
            request.setGeoJson(requestDto.getGeoJson());
        }
        if (requestDto.getCompanyName() != null) {
            request.setCompanyName(requestDto.getCompanyName());
        }
        if (requestDto.getPhoneNumber() != null) {
            request.setPhoneNumber(requestDto.getPhoneNumber());
        }
        if (requestDto.getMessage() != null) {
            request.setMessage(requestDto.getMessage());
        }
        if (requestDto.getStatus() != null) {
            request.setStatus(requestDto.getStatus()); // Assuming status can be updated
        }
        
        // Save the updated request
        request = requestRepository.save(request);
        
        // Convert and return the updated request as a DTO
        return requestUtils.convertToDto(request, null);
    }

    public List<JobDto> getResultsJobs(UUID id){
        Request request = requestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Request not found with id: " + id));

        // Get the list of jobs associated with the request
        List<Job> jobs = request.getJobs();

        // Convert the list of jobs to a list of JobDto
        List<JobDto> jobDtos = jobs.stream()
                .map(job -> new JobDto(
                        job.getId(),
                        job.getStatus(),
                        job.getResultData(),
                        job.getResultGeoJsonData(),
                        job.getSatelliteImageURL(),
                        job.getCreatedAt(),
                        job.getUpdatedAt(),
                        job.isResultFinalized(),
                        request.getId(), // Reference the request ID
                        request.getGeoJson() // Reference the GeoJSON from the request
                ))
                .toList();
        return jobDtos;
    }

    public String getJobResultGeoJson(UUID requestId, Long jobId) {
        // Check if request exists
        Request request = requestRepository.findById(requestId)
                .orElseThrow(() -> new EntityNotFoundException("Request not found for ID: " + requestId));

        // Verify job belongs to the request
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new EntityNotFoundException("Job not found for ID: " + jobId));

        if (!job.getRequest().getId().equals(requestId)) {
            throw new IllegalArgumentException("Job does not belong to the specified request");
        }

        System.out.println(job.getResultGeoJsonData());
        // Return the job result data (assuming Job entity has a `resultData` field)
        return job.getResultGeoJsonData();
    }

    public String getJobResult(UUID requestId, Long jobId) {
        // Check if request exists
        Request request = requestRepository.findById(requestId)
                .orElseThrow(() -> new EntityNotFoundException("Request not found for ID: " + requestId));

        // Verify job belongs to the request
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new EntityNotFoundException("Job not found for ID: " + jobId));

        if (!job.getRequest().getId().equals(requestId)) {
            throw new IllegalArgumentException("Job does not belong to the specified request");
        }

        System.out.println(job.getResultGeoJsonData());
        // Return the job result data (assuming Job entity has a `resultData` field)
        return job.getResultData();
    }

    @Override
    public SuperResolutionDto getSuperResolutionResultData(UUID requestId, Long jobId) {
        Request request = requestRepository.findById(requestId)
                .orElseThrow(() -> new EntityNotFoundException("Request not found for ID: " + requestId));

        // Verify job belongs to the request
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new EntityNotFoundException("Job not found for ID: " + jobId));

        if (!job.getRequest().getId().equals(requestId)) {
            throw new IllegalArgumentException("Job does not belong to the specified request");
        }
        return jobUtils.converToSuperResolutionDto(request, job);
    }

    @Override
    public void finalizeJob(UUID requestId, Long jobId) {
        Request request = requestRepository.findById(requestId).orElseThrow(() -> new EntityNotFoundException("Request not found for Id: "+ requestId));
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new EntityNotFoundException("Job not found for ID: "+ jobId));
        if(!job.getRequest().getId().equals(requestId)){
            throw new IllegalArgumentException("Job does not belong to the specified request");
        }
        job.setResultFinalized(true);
        jobRepository.save(job);
    }

    @Override
    public void deleteJob(UUID requestId, Long jobId) {
        Request request = requestRepository.findById(requestId).orElseThrow(()
                -> new EntityNotFoundException("Request not found for Id: "+ requestId));
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new EntityNotFoundException("Job not found for ID: "+ jobId));
        if(!job.getRequest().getId().equals(requestId)){
            throw new IllegalArgumentException("Job does not belong to the specified request");
        }
        jobRepository.delete(job);
    }

    @Override
    public void resetFinalizedJob(UUID requestId, Long jobId){
        Request request = requestRepository.findById(requestId).orElseThrow(() -> new EntityNotFoundException("Request not found for Id: "+ requestId));
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new EntityNotFoundException("Job not found for ID: "+ jobId));
        if(!job.getRequest().getId().equals(requestId)){
            throw new IllegalArgumentException("Job does not belong to the specified request");
        }
        job.setResultFinalized(false);
        jobRepository.save(job);
    }

    @Override
    public boolean verifyEmailWithRequest(UUID requestId, String emailId) {
        // Fetch the request based on requestId
        Request request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        System.out.println(request.getEmail());
        System.out.println(emailId);
        // Check if the emailId matches the request's associated email
        return request.getEmail().equals(emailId);
    }

    @Override
    public JobDto getFinalizedJob(UUID requestId) {
       Request request = requestRepository.findById(requestId).orElseThrow(() -> new RuntimeException("Request not found"));
       List<Job> jobs = request.getJobs();
       Job finalizedJob = jobs.stream()
                .filter(Job::isResultFinalized)  // Assuming there's a method to check the resultFinalized flag
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No finalized job found for the request"));
       return jobUtils.convertToDto(request, finalizedJob);
    }

    public boolean isAnyJobFinalized(UUID requestId) {
        return jobRepository.existsByRequestIdAndResultFinalized(requestId, true);
    }


}
