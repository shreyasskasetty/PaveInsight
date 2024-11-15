package com.tti.paveinsight.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tti.paveinsight.models.Job;
import com.tti.paveinsight.repositories.JobRepository;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.tti.paveinsight.messaging.JobReplyMessage;

import java.util.concurrent.ConcurrentHashMap;

@Service
public class JobReplyListener {

    private final ConcurrentHashMap<String, JobReplyMessage> jobResponses = new ConcurrentHashMap<>();

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ObjectMapper objectMapper; // Jackson ObjectMapper for JSON serialization

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
            jobRepository.save(job);
            System.out.println("Received reply for correlation ID " + correlationId + ": " +
                    "Status: " + jobReply.getJobStatus() +
                    ", Image URL: " + jobReply.getResultImageURL() +
                    ", Shapefile URL: " + jobReply.getResultShapefileURL());

        } catch (Exception e) {
            System.err.println("Error handling job reply: " + e.getMessage());
        }
    }

    // Method to retrieve the full response based on correlation ID, if needed
    public JobReplyMessage getJobResponse(String correlationId) {
        return jobResponses.get(correlationId);
    }
}
