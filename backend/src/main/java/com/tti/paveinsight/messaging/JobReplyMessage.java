package com.tti.paveinsight.messaging;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JobReplyMessage {

    private String correlationId;
    private String resultZippedShapefileS3URL;
    private String resultGeoJsonS3URL;
    private String superResolutionImageS3URL;
    private String superResolutionTIFS3URL;
    private String bounds;
    private String jobStatus;
    private Long jobId;
    private String error;


    @Override
    public String toString() {
        return "JobReplyMessage{" +
                "correlationId='" + correlationId + '\'' +
                ", resultImageURL='" + resultZippedShapefileS3URL + '\'' +
                ", resultShapefileURL='" + resultGeoJsonS3URL + '\'' +
                ", superResolutionImageURL='" + superResolutionImageS3URL + '\'' +
                ", superResolutionTIFURL='" + superResolutionTIFS3URL + '\'' +
                ", bounds='" + bounds + '\'' +
                ", jobStatus='" + jobStatus + '\'' +
                ", error='" + error + '\'' +
                '}';
    }
}
