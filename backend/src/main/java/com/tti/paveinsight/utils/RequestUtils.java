package com.tti.paveinsight.utils;

import com.tti.paveinsight.dto.JobDto;
import com.tti.paveinsight.dto.RequestDto;
import com.tti.paveinsight.models.Job;
import com.tti.paveinsight.models.Request;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class RequestUtils {
    public RequestDto convertToDto(Request request, List<JobDto> jobs) {
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
                jobs
        );
    }
}
