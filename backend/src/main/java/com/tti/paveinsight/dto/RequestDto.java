package com.tti.paveinsight.dto;

import com.tti.paveinsight.models.Job;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class RequestDto {
    private UUID id;
    private String username;
    private String email;
    private String companyName;
    private String phoneNumber;
    private String geoJson;
    private String message;
    private String status;
    private List<JobDto> jobs;
    private Date requestCreatedAt;
    private Date requestUpdatedAt;

    public RequestDto(UUID id, String username, String email, String companyName, String phoneNumber, String geoJson,
                      String message, String status, Date requestUpdatedAt, Date requestCreatedAt, List<JobDto> jobs) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.companyName = companyName;
        this.phoneNumber = phoneNumber;
        this.geoJson = geoJson;
        this.message = message;
        this.status = status;
        this.jobs = jobs;
        this.requestCreatedAt = requestCreatedAt;
        this.requestUpdatedAt = requestUpdatedAt;
    }
}

