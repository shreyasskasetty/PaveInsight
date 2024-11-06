package com.tti.paveinsight.utils;

import com.tti.paveinsight.dto.RequestDto;
import com.tti.paveinsight.models.Job;
import com.tti.paveinsight.models.Request;
import org.springframework.stereotype.Component;

@Component
public class RequestUtils {
    public RequestDto convertToDto(Request request, Job job) {
        return new RequestDto(
                request.getId(),
                request.getUsername(),
                request.getEmail(),
                request.getCompanyName(),
                request.getPhoneNumber(),
                request.getGeoJson(),
                request.getMessage(),
                request.getStatus(),
                request.getJobId(),
                job != null ? job.getStatus() : null,
                job != null ? job.getResultData() : null,
                job != null ? job.getSatelliteImageURL() : null
        );
    }
}
