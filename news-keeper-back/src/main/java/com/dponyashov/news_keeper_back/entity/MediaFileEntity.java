package com.dponyashov.news_keeper_back.entity;

import com.dponyashov.news_keeper_back.enums.MediaStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "t_media_files")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MediaFileEntity {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String url;

    @Column(name = "s3_key", nullable = false)
    private String s3Key;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MediaStatus status;

    @Column(name = "news_id")
    private Long newsId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
