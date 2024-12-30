package com.tti.paveinsight.messaging;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JobReplyMessage {

    private String correlationId;
    private String resultZippedShapefileURL;
    private String resultGeoJSONURL;
    private String jobStatus;

    private Long jobId;

    private String error;


    @Override
    public String toString() {
        return "JobReplyMessage{" +
                "correlationId='" + correlationId + '\'' +
                ", resultImageURL='" + resultZippedShapefileURL + '\'' +
                ", resultShapefileURL='" + resultGeoJSONURL + '\'' +
                ", jobStatus='" + jobStatus + '\'' +
                ", error='" + error + '\'' +
                '}';
    }
}
