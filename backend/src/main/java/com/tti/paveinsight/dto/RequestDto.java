package com.tti.paveinsight.dto;

public class RequestDto {
    private Long id;
    private String username;
    private String email;
    private String companyName;
    private String phoneNumber;
    private String geoJson;
    private String message;
    private String status;
    private Long jobId;
    private String jobStatus;
    private String jobResultData;
    private String satelliteImageURL;

    public RequestDto(Long id, String username, String email, String companyName, String phoneNumber, String geoJson,
                      String message, String status, Long jobId, String jobStatus, String jobResultData, String satelliteImageURL) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.companyName = companyName;
        this.phoneNumber = phoneNumber;
        this.geoJson = geoJson;
        this.message = message;
        this.status = status;
        this.jobId = jobId;
        this.jobStatus = jobStatus;
        this.jobResultData = jobResultData;
        this.satelliteImageURL = satelliteImageURL;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getCompanyName() {
        return companyName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public String getGeoJson() {
        return geoJson;
    }

    public String getMessage() {
        return message;
    }

    public String getStatus() {
        return status;
    }

    public Long getJobId() {
        return jobId;
    }

    public String getJobStatus() {
        return jobStatus;
    }

    public String getJobResultData() {
        return jobResultData;
    }

    public String getSatelliteImageURL() {
        return satelliteImageURL;
    }
}

