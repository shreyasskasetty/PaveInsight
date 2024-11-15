package com.tti.paveinsight.messaging;

public class JobReplyMessage {

    private String correlationId;
    private String resultImageURL;
    private String resultShapefileURL;
    private String jobStatus;

    private Long jobId;

    private String error;

    // Getters and Setters

    public String getCorrelationId() {
        return correlationId;
    }

    public void setCorrelationId(String correlationId) {
        this.correlationId = correlationId;
    }

    public String getResultImageURL() {
        return resultImageURL;
    }

    public void setResultImageURL(String resultImageURL) {
        this.resultImageURL = resultImageURL;
    }

    public String getResultShapefileURL() {
        return resultShapefileURL;
    }

    public void setResultShapefileURL(String resultShapefileURL) {
        this.resultShapefileURL = resultShapefileURL;
    }

    public String getJobStatus() {
        return jobStatus;
    }

    public void setJobStatus(String jobStatus) {
        this.jobStatus = jobStatus;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public void setJobId(Long jobId) {
        this.jobId = jobId;
    }
    public Long getJobId() {
        return jobId;
    }
    @Override
    public String toString() {
        return "JobReplyMessage{" +
                "correlationId='" + correlationId + '\'' +
                ", resultImageURL='" + resultImageURL + '\'' +
                ", resultShapefileURL='" + resultShapefileURL + '\'' +
                ", jobStatus='" + jobStatus + '\'' +
                ", error='" + error + '\'' +
                '}';
    }
}
