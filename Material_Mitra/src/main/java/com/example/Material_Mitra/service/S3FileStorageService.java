package com.example.Material_Mitra.service;

// ============================================
// AWS S3 FILE STORAGE - COMMENTED OUT
// Now using LocalFileStorageService instead
// Files are stored locally in the 'uploads' directory
// ============================================

/*
import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

@Service
public class S3FileStorageService {

    @Value("${aws.access-key-id}")
    private String accessKeyId;

    @Value("${aws.secret-access-key}")
    private String secretAccessKey;

    @Value("${aws.region}")
    private String region;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    private S3Client s3Client;
    private S3Presigner s3Presigner;

    private S3Client getS3Client() {
        if (s3Client == null) {
            AwsBasicCredentials awsCreds = AwsBasicCredentials.create(accessKeyId, secretAccessKey);
            s3Client = S3Client.builder()
                    .region(Region.of(region))
                    .credentialsProvider(StaticCredentialsProvider.create(awsCreds))
                    .build();
        }
        return s3Client;
    }

    private S3Presigner getS3Presigner() {
        if (s3Presigner == null) {
            AwsBasicCredentials awsCreds = AwsBasicCredentials.create(accessKeyId, secretAccessKey);
            s3Presigner = S3Presigner.builder()
                    .region(Region.of(region))
                    .credentialsProvider(StaticCredentialsProvider.create(awsCreds))
                    .build();
        }
        return s3Presigner;
    }

    public String storeFile(MultipartFile file, String subDirectory) {
        if (file.isEmpty()) {
            throw new RuntimeException("Failed to store empty file");
        }

        // Validate file size (5MB max)
        long maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.getSize() > maxSize) {
            throw new RuntimeException("File size exceeds the maximum limit of 5MB. Please upload a smaller file.");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !isValidFileType(contentType)) {
            throw new RuntimeException("Invalid file type. Only PDF, DOC, DOCX, and image files are allowed.");
        }

        try {
            // Generate unique filename with subdirectory
            String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
            String fileExtension = getFileExtension(originalFileName);
            String fileName = UUID.randomUUID().toString() + fileExtension;
            
            // Construct S3 key with subdirectory
            String s3Key = subDirectory != null && !subDirectory.isEmpty() 
                ? subDirectory + "/" + fileName 
                : fileName;

            // Upload to S3
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .contentType(contentType)
                    .build();

            getS3Client().putObject(putObjectRequest, 
                RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            return s3Key;

        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + file.getOriginalFilename() + " to S3. Please try again!", ex);
        }
    }

    public InputStream loadFileAsStream(String s3Key) {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .build();

            return getS3Client().getObject(getObjectRequest);
        } catch (Exception ex) {
            throw new RuntimeException("File not found in S3: " + s3Key, ex);
        }
    }

    public boolean deleteFile(String s3Key) {
        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .build();

            getS3Client().deleteObject(deleteObjectRequest);
            return true;
        } catch (Exception ex) {
            throw new RuntimeException("Could not delete file from S3: " + s3Key, ex);
        }
    }

    public String getFileUrl(String s3Key) {
        if (s3Key == null || s3Key.isEmpty()) {
            return null;
        }
        
        try {
            // Generate presigned URL valid for 1 hour
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofHours(1))
                    .getObjectRequest(getObjectRequest)
                    .build();

            PresignedGetObjectRequest presignedRequest = getS3Presigner().presignGetObject(presignRequest);
            return presignedRequest.url().toString();
        } catch (Exception ex) {
            throw new RuntimeException("Could not generate presigned URL for: " + s3Key, ex);
        }
    }

    public String getPublicFileUrl(String s3Key) {
        if (s3Key == null || s3Key.isEmpty()) {
            return null;
        }
        
        // Return public S3 URL (only works if bucket has public read access)
        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, s3Key);
    }

    private boolean isValidFileType(String contentType) {
        return contentType.equals("application/pdf") ||
               contentType.equals("application/msword") ||
               contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
               contentType.equals("image/jpeg") ||
               contentType.equals("image/png") ||
               contentType.equals("image/gif");
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return "";
        }
        int lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex == -1) {
            return "";
        }
        return fileName.substring(lastDotIndex);
    }

    public String getContentType(String s3Key) {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .build();

            return getS3Client().headObject(builder -> builder
                    .bucket(bucketName)
                    .key(s3Key))
                    .contentType();
        } catch (Exception ex) {
            return "application/octet-stream";
        }
    }
}
*/

// ============================================
// END OF COMMENTED AWS S3 CODE
// ============================================

// This class is now replaced by FileStorageService.java
// which uses local file storage instead of AWS S3

