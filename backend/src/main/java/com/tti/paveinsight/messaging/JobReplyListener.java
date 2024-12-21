package com.tti.paveinsight.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tti.paveinsight.models.Job;
import com.tti.paveinsight.repositories.JobRepository;
import com.tti.paveinsight.services.staticpage.StaticPageGeneratorService;
import com.tti.paveinsight.services.storage.StorageService;
import com.tti.paveinsight.utils.S3Utils;
import lombok.AllArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Path;
import java.util.concurrent.ConcurrentHashMap;


@Service
@AllArgsConstructor
public class JobReplyListener {

    private final ConcurrentHashMap<String, JobReplyMessage> jobResponses = new ConcurrentHashMap<>();

    private JobRepository jobRepository;

    private ObjectMapper objectMapper; // Jackson ObjectMapper for JSON serialization

    private final S3Utils s3Utils;

    private final StorageService storageService;

    private final StaticPageGeneratorService staticPageGeneratorService;

    @RabbitListener(queues = "job-reply-queue")
    public void handleJobReply(JobReplyMessage jobReply) {
        try {
            // Extract the correlation ID from the job reply
            String correlationId = jobReply.getCorrelationId();

            // Store the full JobReplyMessage with correlation ID for reference
            jobResponses.put(correlationId, jobReply);
            Long jobId = jobReply.getJobId();
            Job job = jobRepository.findById(jobId)
                    .orElseThrow(() -> new IllegalArgumentException("Job not found for correlation ID: " + correlationId));
            String resultDataJson = objectMapper.writeValueAsString(jobReply);
            // Update the job's status and resultData field
            job.setStatus("COMPLETED");
            job.setResultData(resultDataJson);
            jobResponses.put(jobReply.getCorrelationId(), jobReply);
            // Save the updated job to the database

            String geoJSONURL = jobReply.getResultGeoJSONURL();
            String bucketName = s3Utils.extractBucketNameFromUrl(geoJSONURL);
            String fileName = s3Utils.extractFileNameFromUrl(geoJSONURL);
            String resultGeoJsonContent = storageService.readFile(bucketName, fileName);
            job.setResultGeoJsonData(resultGeoJsonContent);
            jobRepository.save(job);
            System.out.println("Received reply for correlation ID " + correlationId + ": " +
                    "Status: " + jobReply.getJobStatus() +
                    ", Image URL: " + jobReply.getResultImageURL() +
                    ", Shapefile URL: " + jobReply.getResultGeoJSONURL());
//            System.out.println(resultGeoJsonContent);
        } catch (Exception e) {
            System.err.println("Error handling job reply: " + e.getMessage());
        }
    }

    // Method to retrieve the full response based on correlation ID, if needed
    public JobReplyMessage getJobResponse(String correlationId) {
        return jobResponses.get(correlationId);
    }
}
