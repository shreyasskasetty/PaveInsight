package com.tti.paveinsight.models;

import jakarta.persistence.*;

import java.util.Date;

@Entity
public class Job {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne
    @JoinColumn(name = "request_id")
    private Request request;
    private String status;
    @Column(columnDefinition = "json")
    private String resultData;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Request getRequest() {
        return request;
    }

    public void setRequest(Request request) {
        this.request = request;
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

    public Date getLastUpdateDate() {
        return lastUpdateDate;
    }

    public void setLastUpdateDate(Date lastUpdateDate) {
        this.lastUpdateDate = lastUpdateDate;
    }

    public Date getProcessingDate() {
        return processingDate;
    }

    public void setProcessingDate(Date processingDate) {
        this.processingDate = processingDate;
    }

    private String satelliteImageURL;
    @Temporal(TemporalType.TIMESTAMP)
    private Date lastUpdateDate;
    @Temporal(TemporalType.TIMESTAMP)
    private Date processingDate;
}
