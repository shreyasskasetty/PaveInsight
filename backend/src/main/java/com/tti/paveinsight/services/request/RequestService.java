package com.tti.paveinsight.services.request;

import com.tti.paveinsight.dto.JobDto;
import com.tti.paveinsight.dto.RequestDto;
import com.tti.paveinsight.dto.SuperResolutionDto;
import com.tti.paveinsight.models.Job;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.UUID;

public interface RequestService {
    List<RequestDto> getAllRequests();
    RequestDto createRequest(RequestDto requestDto);
    long getTotalRequestCount();
    long getPendingRequestCount();
    long getCompletedRequestCount();
    RequestDto getRequestById(UUID id);
    void deleteRequestById(UUID id);
    RequestDto submitJobForRequest(UUID requestId);
    RequestDto updateRequest(UUID id, RequestDto requestDto);
    List<JobDto> getResultsJobs(UUID id);
    String getJobResultGeoJson(UUID requestId, Long jobId);

    String getJobResult(UUID requestId, Long jobId);

    SuperResolutionDto getSuperResolutionResultData(UUID requestId, Long jobId);

    void finalizeJob(UUID requestId, Long jobId);

    void deleteJob(UUID requestId, Long jobId);
    void resetFinalizedJob(UUID requestId, Long jobId);

    boolean verifyEmailWithRequest(UUID requestId, String emailId);

    JobDto getFinalizedJob(UUID requestId);
}