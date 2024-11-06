package com.tti.paveinsight.services;

import com.tti.paveinsight.dto.RequestDto;
import com.tti.paveinsight.models.Job;
import com.tti.paveinsight.models.Request;
import com.tti.paveinsight.repositories.JobRepository;
import com.tti.paveinsight.repositories.RequestRepository;
import com.tti.paveinsight.utils.RequestUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RequestService {
    private final RequestRepository requestRepository;
    private final JobRepository jobRepository;

    private final RequestUtils requestUtils;

    @Autowired
    public RequestService(RequestRepository requestRepository, JobRepository jobRepository, RequestUtils requestUtils){
        this.requestRepository = requestRepository;
        this.jobRepository = jobRepository;
        this.requestUtils = requestUtils;
    }

    public List<RequestDto> getAllRequests() {
        return requestRepository.findAll().stream()
                .map(request -> {
                    Job job = null;
                    if (request.getJobId() != null){
                        job = jobRepository.findById(request.getJobId()).orElse(null);
                    }
                    return new RequestDto(
                            request.getId(), request.getUsername(), request.getEmail(), request.getCompanyName(),
                            request.getPhoneNumber(), request.getGeoJson(), request.getMessage(), request.getStatus(),
                            request.getJobId(), job != null ? job.getStatus() : null,
                            job != null ? job.getResultData() : null,
                            job != null ? job.getSatelliteImageURL() : null);
                }).collect(Collectors.toList());
    }

    public RequestDto createRequest(RequestDto requestDto){
        Request request = new Request();
        request.setUsername(requestDto.getUsername());
        request.setEmail(requestDto.getEmail());
        request.setGeoJson(requestDto.getGeoJson());
        request.setCompanyName(requestDto.getCompanyName());
        request.setPhoneNumber(requestDto.getPhoneNumber());
        request.setMessage(requestDto.getMessage());
        request.setStatus("PENDING");
        request = requestRepository.save(request);
        return  requestUtils.convertToDto(request, null);
    }
    public RequestDto getRequestById(Long id) {
        Request request = requestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Request not found with id: " + id));
        Job job = null;
        if (request.getJobId() != null) {
            job = jobRepository.findById(request.getJobId()).orElse(null);
        }
        return new RequestDto(
                request.getId(), request.getUsername(), request.getEmail(), request.getCompanyName(),
                request.getPhoneNumber(), request.getGeoJson(), request.getMessage(), request.getStatus(),
                request.getJobId(), job != null ? job.getStatus() : null,
                job != null ? job.getResultData() : null,
                job != null ? job.getSatelliteImageURL() : null);
    }

    public void linkJobToRequest(Long requestId, Long jobId) {
        Request request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found with id: " + requestId));
        request.setJobId(jobId);
        requestRepository.save(request);
    }

    public void deleteRequestById(Long id) {
        if (requestRepository.existsById(id)) {
            requestRepository.deleteById(id);
        } else {
            throw new IllegalArgumentException("Request not found with id: " + id);
        }
    }
}
