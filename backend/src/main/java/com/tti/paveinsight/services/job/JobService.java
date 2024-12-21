package com.tti.paveinsight.services.job;
import com.tti.paveinsight.dto.JobDto;

public interface JobService {
    void submitJobAsync(JobDto jobDto);
}
