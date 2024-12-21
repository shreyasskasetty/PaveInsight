package com.tti.paveinsight.utils;

import org.springframework.stereotype.Component;

@Component
public class S3Utils {
    public String extractBucketNameFromUrl(String s3Url) {
        return s3Url.split("/")[2].split("\\.")[0]; // Extract bucket name
    }

    public String extractFileNameFromUrl(String s3Url) {
        return s3Url.substring(s3Url.indexOf(".com/") + 5); // Extract file key
    }
}
