package com.tti.paveinsight.messaging;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JobReplyMessage {

    private String correlationId;
    private String resultZippedShapefileURL;
    private String resultGeoJSONURL;
    private String superResolutionURL;
    private String bounds;
    private String jobStatus;
    private Long jobId;
    private String error;


    @Override
    public String toString() {
        return "JobReplyMessage{" +
                "correlationId='" + correlationId + '\'' +
                ", resultImageURL='" + resultZippedShapefileURL + '\'' +
                ", resultShapefileURL='" + resultGeoJSONURL + '\'' +
                ", superResolutionURL='" + superResolutionURL + '\'' +
                ", bounds='" + bounds + '\'' +
                ", jobStatus='" + jobStatus + '\'' +
                ", error='" + error + '\'' +
                '}';
    }
}
