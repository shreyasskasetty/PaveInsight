package com.tti.paveinsight.controllers;

import com.tti.paveinsight.dto.RequestDto;
import com.tti.paveinsight.services.RequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/requests")
public class RequestController {
    private final RequestService requestService;

    @Autowired RequestController(RequestService requestService){
        this.requestService = requestService;
    }

    @GetMapping
    public ResponseEntity<List<RequestDto>> getAllRequests(){
        List<RequestDto> requests = requestService.getAllRequests();
        return ResponseEntity.ok(requests);
    }
    @GetMapping("/{id}")
    public ResponseEntity<RequestDto> getRequestById(@PathVariable Long id) {
        RequestDto request = requestService.getRequestById(id);
        return ResponseEntity.ok(request);
    }

    @PostMapping
    public ResponseEntity<RequestDto> createRequest(@RequestBody RequestDto requestDto){
        RequestDto createdRequest = requestService.createRequest(requestDto);
        return ResponseEntity.status(201).body(createdRequest);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRequestById(@PathVariable Long id) {
        requestService.deleteRequestById(id);
        return ResponseEntity.noContent().build();
    }
}
