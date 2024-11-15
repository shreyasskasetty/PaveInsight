package com.tti.paveinsight.dto;

import java.util.Date;
import java.util.List;

public class JobDto {

    private Long id;
    private String status;
    private String resultData;
    private String satelliteImageURL;
    private Date createdAt;
    private Date updatedAt;
    private Long requestId; // To associate with a specific request
    private String geoJson; // The geoJSON data for the job
    List<JobDto> jobs;

    // Constructors
    public JobDto() {
    }

    public JobDto(Long id, String status, String resultData, String satelliteImageURL, Date createdAt, Date updatedAt, Long requestId, String geoJson) {
        this.id = id;
        this.status = status;
        this.resultData = resultData;
        this.satelliteImageURL = satelliteImageURL;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.requestId = requestId;
        this.geoJson = geoJson;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getResultData() {
        return resultData;
    }

    public void setResultData(String resultData) {
        this.resultData = resultData;
    }

    public String getSatelliteImageURL() {
        return satelliteImageURL;
    }

    public void setSatelliteImageURL(String satelliteImageURL) {
        this.satelliteImageURL = satelliteImageURL;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Long getRequestId() {
        return requestId;
    }

    public void setRequestId(Long requestId) {
        this.requestId = requestId;
    }

    public String getGeoJson() {
        return geoJson;
    }

    public void setGeoJson(String geoJson) {
        this.geoJson = geoJson;
    }

    @Override
    public String toString() {
        return "JobDto{" +
                "id=" + id +
                ", status='" + status + '\'' +
                ", resultData='" + resultData + '\'' +
                ", satelliteImageURL='" + satelliteImageURL + '\'' +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                ", requestId=" + requestId +
                ", geoJson='" + geoJson + '\'' +
                '}';
    }
}