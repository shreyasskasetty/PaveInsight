package com.tti.paveinsight.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
public class JobDto {

    private Long id;
    private String status;
    private String resultData;
    private String resultGeoJsonData;
    private String satelliteImageURL;
    private Date createdAt;
    private Date updatedAt;
    private boolean isFinalized;
    private UUID requestId; // To associate with a specific request
    private String geoJson; // The geoJSON data for the job


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