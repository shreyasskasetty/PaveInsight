package com.tti.paveinsight.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Entity
@Getter
@Setter
@EntityListeners(AuditingEntityListener.class)
public class Request {
    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(updatable = false, nullable = false, unique = true)
    private UUID id;
    private String username;
    private String email;
    private String companyName;
    private String phoneNumber;
    @Column(columnDefinition = "json")
    private String geoJson;
    private String message;
    private String status;
    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Job> jobs = new ArrayList<>();
    @LastModifiedDate  // Automatically updates the timestamp when modified
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;
    @CreatedDate // Automatically updates the timestamp when modified
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    public void addJob(Job job) {
        jobs.add(job);
        job.setRequest(this);
    }
    public void removeJob(Job job) {
        jobs.remove(job);
        job.setRequest(null);
    }
}
