package com.tti.paveinsight.services.storage;

import org.springframework.stereotype.Service;

import org.springframework.util.StreamUtils;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.Bucket;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class StorageService {

    private final S3Client s3Client;

    public StorageService(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    public List<String> listBuckets() {
        return s3Client.listBuckets()
                .buckets()
                .stream()
                .map(Bucket::name)
                .collect(Collectors.toList());
    }

    public String uploadFile(String bucketName, String originalFileName, InputStream fileContent) throws IOException {
        // Generate a unique file name to prevent overwriting
        String uniqueFileName = UUID.randomUUID() + "-" + originalFileName;

        // Upload the file to S3
        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(uniqueFileName)
                        .build(),
                software.amazon.awssdk.core.sync.RequestBody.fromInputStream(fileContent, fileContent.available())
        );

        return uniqueFileName;
    }

    public String readFile(String bucketName, String fileName) throws IOException {
        // Fetch the file from S3
        ResponseInputStream<GetObjectResponse> response = s3Client.getObject(
                request -> request.bucket(bucketName).key(fileName)
        );

        // Read the file content
        return StreamUtils.copyToString(response, StandardCharsets.UTF_8);
    }

    public void deleteFile(String bucketName, String fileName) {
        // Delete the file from S3
        s3Client.deleteObject(
                DeleteObjectRequest.builder()
                        .bucket(bucketName)
                        .key(fileName)
                        .build()
        );
    }
}
