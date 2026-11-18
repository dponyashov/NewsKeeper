package com.dponyashov.news_keeper_back.config;

import jakarta.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

import java.net.URI;

@Configuration
@RequiredArgsConstructor
public class S3Config {

    private final AppConfig appConfig;

    @Bean
    public S3Client s3Client() {
        AppConfig.S3 s3Props = appConfig.s3();

        return S3Client.builder()
                .endpointOverride(URI.create(s3Props.endpoint()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(s3Props.accessKey(), s3Props.secretKey())))
                .region(Region.of(s3Props.region()))
                .forcePathStyle(true)
                .build();
    }
}
