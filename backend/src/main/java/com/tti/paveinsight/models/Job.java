package com.tti.paveinsight.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.bind.DefaultValue;
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

    private String satelliteImageURL;
    @LastModifiedDate
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;
    @CreatedDate
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    private boolean resultFinalized;
}
