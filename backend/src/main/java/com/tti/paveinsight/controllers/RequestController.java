package com.tti.paveinsight.controllers;

import com.tti.paveinsight.dto.*;
import com.tti.paveinsight.services.email.EmailServiceImpl;
import com.tti.paveinsight.services.request.RequestServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/requests")
public class RequestController {
    private final RequestServiceImpl requestServiceImpl;

    private final EmailServiceImpl emailService;

    @Autowired RequestController(RequestServiceImpl requestServiceImpl, EmailServiceImpl emailService){
        this.requestServiceImpl = requestServiceImpl;
        this.emailService = emailService;
    }

    @GetMapping
    public ResponseEntity<List<RequestDto>> getAllRequests(){
        List<RequestDto> requests = requestServiceImpl.getAllRequests();
        return ResponseEntity.ok(requests);
    }
    @GetMapping("/{id}")
    public ResponseEntity<RequestDto> getRequestById(@PathVariable UUID id) {
        RequestDto request = requestServiceImpl.getRequestById(id);
        return ResponseEntity.ok(request);
    }

    @GetMapping("/count/total")
    public ResponseEntity<Long> getTotalRequestCount(){
        return ResponseEntity.ok(requestServiceImpl.getTotalRequestCount());
    }

    @GetMapping("/count/pending")
    public ResponseEntity<Long> getPendingRequestCount(){
        return ResponseEntity.ok(requestServiceImpl.getPendingRequestCount());
    }

    @GetMapping("/count/completed")
    public ResponseEntity<Long> getCompletedRequestCount(){
        return ResponseEntity.ok(requestServiceImpl.getCompletedRequestCount());
    }

    @PostMapping
    public ResponseEntity<RequestDto> createRequest(@RequestBody RequestDto requestDto){
        RequestDto createdRequest = requestServiceImpl.createRequest(requestDto);
        return ResponseEntity.status(201).body(createdRequest);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRequestById(@PathVariable UUID id) {
        requestServiceImpl.deleteRequestById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<RequestDto> updateRequest(@PathVariable UUID id, @RequestBody RequestDto requestDto) {
        RequestDto updatedRequest = requestServiceImpl.updateRequest(id, requestDto);
        return ResponseEntity.ok(updatedRequest);
    }

    @PostMapping("/{id}/submit-job")
    public ResponseEntity<RequestDto> submitJob(@PathVariable UUID id) {
        RequestDto submittedJob = requestServiceImpl.submitJobForRequest(id);
        return ResponseEntity.ok(submittedJob);
    }

    @GetMapping("/{id}/jobs-results")
    public ResponseEntity<?> getJobsResults(@PathVariable UUID id) {
        List<JobDto> jobDtos = requestServiceImpl.getResultsJobs(id);

        if (jobDtos.isEmpty()) {
            // Return a 404 Not Found with a descriptive message
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No jobs found for this request ID yet.");
        }

        return ResponseEntity.ok(jobDtos);
    }

    @PostMapping("{id}/finalized-job")
    public ResponseEntity<?> getFinalizedJob(@PathVariable UUID id, @RequestBody EmailRequestDto emailRequestDto){

        boolean isEmailValid = requestServiceImpl.verifyEmailWithRequest(id, emailRequestDto.getEmailId());
        if (!isEmailValid) {
            System.out.println("Email ID does not match");
            return ResponseEntity.status(400).body("Email ID does not match the request ID.");
        }
        // Fetch the finalized job
        try {
            JobDto finalizedJob = requestServiceImpl.getFinalizedJob(id);
            if (finalizedJob == null) {
                // If no finalized job is found, return 404 Not Found
                return ResponseEntity.status(404).body("No finalized job found for the given ID.");
            }

            // Return the finalized job details
            return ResponseEntity.ok(finalizedJob);
        } catch (Exception e) {
            // Handle any unexpected errors
            return ResponseEntity.status(500).body("An error occurred while retrieving the finalized job: " + e.getMessage());
        }
    }

    @PostMapping("{requestId}/job/{jobId}/finalize")
    public ResponseEntity<?> finalizeJob(@PathVariable UUID requestId, @PathVariable Long jobId){
        boolean isAnyJobFinalized = requestServiceImpl.isAnyJobFinalized(requestId);

        if (isAnyJobFinalized) {
            System.out.println("Another job is already finalized.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Another job is already finalized. Only one job can be finalized at a time.");
        }

        try {
            requestServiceImpl.finalizeJob(requestId, jobId);
        }catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok("Job result successfully finalized!");
    }

    @PostMapping("{requestId}/job/{jobId}/reset-finalize")
    public ResponseEntity<?> resetFinalizedJob(@PathVariable UUID requestId, @PathVariable Long jobId){
        try {
            requestServiceImpl.resetFinalizedJob(requestId, jobId);
        }catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok("Reset Success!");
    }

    @DeleteMapping("{requestId}/job/{jobId}/delete")
    public ResponseEntity<?> deleteJob(@PathVariable UUID requestId, @PathVariable Long jobId){
        try {
            requestServiceImpl.deleteJob(requestId, jobId);
        }catch (Exception e) {
            System.out.println(e.getMessage());
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok("Job Id: "+jobId+" deleted successfully");
    }

    @GetMapping("{requestId}/job/{jobId}/geojson-result")
    public ResponseEntity<String> getJobResultGeoJSON(@PathVariable UUID requestId, @PathVariable Long jobId) {
        // Delegate logic to the service
        String result = requestServiceImpl.getJobResultGeoJson(requestId, jobId);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("{requestId}/job/{jobId}/result")
    public ResponseEntity<String> getJobResult(@PathVariable UUID requestId, @PathVariable Long jobId) {
        // Delegate logic to the service
        String result = requestServiceImpl.getJobResult(requestId, jobId);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("{requestId}/job/{jobId}/sri-result")
    public ResponseEntity<SuperResolutionDto> getSuperResolutionData(@PathVariable UUID requestId, @PathVariable Long jobId){
        SuperResolutionDto result = requestServiceImpl.getSuperResolutionResultData(requestId, jobId);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("{requestId}/send-email")
    public ResponseEntity<?> sendEmail(@PathVariable UUID requestId, @RequestBody SendEmailDto sendEmailDto){
        String link = sendEmailDto.getLink();
        System.out.println(link);
        System.out.println(requestId);
        try {
            // Fetch the request details to get the associated email
            RequestDto request = requestServiceImpl.getRequestById(requestId);
            if (request == null) {
                return ResponseEntity.status(404).body("Request not found.");
            }

            String emailId = request.getEmail(); // Assuming 'Request' entity has an 'email' field

            // Construct the email body
            String emailBody = "Hello, \n\nThe results for request ID " + requestId.toString() + " are now ready. " +
                    "You can view the results by following this link: \n" +
                     link + "\n" +
                    "Best regards,\nPaveVision";

            // Send the email
            emailService.sendEmail(emailId, "Results Ready for Request ID " + requestId.toString(), emailBody);

            return ResponseEntity.ok("Email sent successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("An error occurred while sending the email: " + e.getMessage());
        }
    }
}
