package com.tti.paveinsight.controllers;

import com.tti.paveinsight.services.storage.StorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/storage/")
public class StorageController {
    private final StorageService storageService;

    public StorageController(StorageService storageService) {
        this.storageService = storageService;
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(
            @RequestParam("bucketName") String bucketName,
            @RequestParam("file") MultipartFile file
    ) {
        try {
            String fileName = storageService.uploadFile(bucketName, file.getOriginalFilename(), file.getInputStream());
            return ResponseEntity.ok("File uploaded successfully with name: " + fileName);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Failed to upload file: " + e.getMessage());
        }
    }

    @GetMapping("/read")
    public ResponseEntity<String> readFile(
            @RequestParam("bucketName") String bucketName,
            @RequestParam("fileName") String fileName
    ) {
        try {
            String content = storageService.readFile(bucketName, fileName);
            return ResponseEntity.ok(content);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Failed to read file: " + e.getMessage());
        }
    }

    @GetMapping("/buckets")
    public ResponseEntity<List<String>> listBuckets() {
        try {
            List<String> buckets = storageService.listBuckets();
            return ResponseEntity.ok(buckets);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<String> deleteFile(
            @RequestParam("bucketName") String bucketName,
            @RequestParam("fileName") String fileName
    ) {
        try {
            storageService.deleteFile(bucketName, fileName);
            return ResponseEntity.ok("File deleted successfully: " + fileName);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to delete file: " + e.getMessage());
        }
    }
}
