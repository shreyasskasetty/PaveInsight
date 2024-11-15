package com.tti.paveinsight.utils;

import com.tti.paveinsight.dto.JobDto;
import com.tti.paveinsight.models.Job;
import com.tti.paveinsight.models.Request;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class JobUtils {
    public JobDto convertToDto(Request request, Job job) {
        return new JobDto(
                job.getId(),
                job.getStatus(),
                job.getResultData(),
                job.getSatelliteImageURL(),
                job.getCreatedAt(),
                job.getUpdatedAt(),
                request.getId(),  // requestId from the associated request
                request.getGeoJson()  // geoJson from the associated request
        );
    }
}
