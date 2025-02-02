package com.tti.paveinsight.utils;

import com.tti.paveinsight.dto.JobDto;
import com.tti.paveinsight.dto.SuperResolutionDto;
import com.tti.paveinsight.models.Job;
import com.tti.paveinsight.models.Request;
import org.springframework.stereotype.Component;

@Component
public class JobUtils {
    public JobDto convertToDto(Request request, Job job) {
        return new JobDto(
                job.getId(),
                job.getStatus(),
                job.getResultData(),
                job.getResultGeoJsonData(),
                job.getSatelliteImageS3URL(),
                job.getCreatedAt(),
                job.getUpdatedAt(),
                job.isResultFinalized(),
                request.getId(),  // requestId from the associated request
                request.getGeoJson()  // geoJson from the associated request

        );
    }
    public SuperResolutionDto converToSuperResolutionDto(Request request, Job job){
        return new SuperResolutionDto(job.getSuperResolutionImageS3URL(), job.getBounds());
    }
}
