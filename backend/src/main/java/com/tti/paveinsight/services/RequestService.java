package com.tti.paveinsight.services;

import com.tti.paveinsight.dto.JobDto;
import com.tti.paveinsight.dto.RequestDto;
import com.tti.paveinsight.models.Job;
import com.tti.paveinsight.models.Request;
import com.tti.paveinsight.repositories.JobRepository;
import com.tti.paveinsight.repositories.RequestRepository;
import com.tti.paveinsight.utils.JobUtils;
import com.tti.paveinsight.utils.RequestUtils;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RequestService {
    private final RequestRepository requestRepository;
    private final JobRepository jobRepository;
    private final JobService jobService;
    private final RequestUtils requestUtils;
    private final JobUtils jobUtils;

    @Autowired
    public RequestService(RequestRepository requestRepository, JobRepository jobRepository, JobService jobService, RequestUtils requestUtils, JobUtils jobUtils){
        this.requestRepository = requestRepository;
        this.jobRepository = jobRepository;
        this.requestUtils = requestUtils;
        this.jobUtils = jobUtils;
        this.jobService = jobService;
    }

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

    public RequestDto getRequestById(Long id) {
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


    public void deleteRequestById(Long id) {
        if (requestRepository.existsById(id)) {
            requestRepository.deleteById(id);
        } else {
            throw new IllegalArgumentException("Request not found with id: " + id);
        }
    }

    public RequestDto submitJobForRequest(Long requestId) {
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
                job.getSatelliteImageURL(),
                job.getCreatedAt(),
                job.getUpdatedAt(),
                request.getId(),       // requestId from the associated request
                request.getGeoJson()    // geoJson from the associated request
        );

        // Publish the job to RabbitMQ for processing
        jobService.submitJobAsync(jobDto);

        List<JobDto> jobDtos = request.getJobs().stream().map(j -> jobUtils.convertToDto(request, j)).toList();

        // Convert the updated request to RequestDto and return
        return requestUtils.convertToDto(request, jobDtos);
    }


    public RequestDto updateRequest(Long id, RequestDto requestDto){
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
}
