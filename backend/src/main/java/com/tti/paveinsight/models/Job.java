package com.tti.paveinsight.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.Date;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class Job {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "request_id", nullable = false) // Many jobs to one request
    private Request request;
    private String status;
    @Column(columnDefinition = "json")
    private String resultData;
    @Column(columnDefinition = "json")
    private String resultGeoJsonData;

    private String superResolutionImageS3URL;

    private String superResolutionTIFS3URL;

    @Column(columnDefinition = "json")
    private String bounds;

    private String satelliteImageS3URL;
    @LastModifiedDate
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;
    @CreatedDate
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    private boolean resultFinalized;
}
