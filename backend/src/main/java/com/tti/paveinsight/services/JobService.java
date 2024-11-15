package com.tti.paveinsight.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tti.paveinsight.dto.JobDto;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class JobService {
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    @Autowired
    public JobService(RabbitTemplate rabbitTemplate, ObjectMapper objectMapper) {
        this.rabbitTemplate = rabbitTemplate;
        this.objectMapper = objectMapper;
    }

    public void submitJobAsync(JobDto jobDto) {
        try {
            // Convert JobDto to JSON string
            String jobData = objectMapper.writeValueAsString(jobDto);

            // Generate a unique correlation ID
            String correlationId = UUID.randomUUID().toString();
            CorrelationData correlationData = new CorrelationData(correlationId);

            // Send the job to RabbitMQ with a correlation ID and specify the reply queue
            rabbitTemplate.convertAndSend(
                    "pci-analysis",       // Exchange name
                    "pci-analysis-queue", // Routing key
                    jobData,              // Job data (as JSON string)
                    message -> {
                        message.getMessageProperties().setReplyTo("job-reply-queue"); // Set reply queue
                        message.getMessageProperties().setCorrelationId(correlationId); // Set correlation ID
                        return message;
                    },
                    correlationData
            );

            System.out.println("Job submitted with correlation ID: " + correlationId);
        } catch (Exception e) {
            System.err.println("Failed to submit job: " + e.getMessage());
        }
    }
}
