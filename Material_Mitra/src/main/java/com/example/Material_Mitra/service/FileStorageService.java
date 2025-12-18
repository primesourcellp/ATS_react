package com.example.Material_Mitra.service;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    private Path getFileStorageLocation() {
        Path fileStorageLocation;
        
        // If uploadDir is a relative path, resolve it relative to the current working directory
        // If it's an absolute path, use it as-is
        if (Paths.get(uploadDir).isAbsolute()) {
            fileStorageLocation = Paths.get(uploadDir).normalize();
        } else {
            // Use relative path from current working directory (project root)
            fileStorageLocation = Paths.get(System.getProperty("user.dir"), uploadDir).normalize();
        }
        
        System.out.println("=== FILE STORAGE DEBUG ===");
        System.out.println("Upload directory config: " + uploadDir);
        System.out.println("Resolved path: " + fileStorageLocation.toAbsolutePath());
        System.out.println("Path exists: " + Files.exists(fileStorageLocation));
        System.out.println("Path is writable: " + Files.isWritable(fileStorageLocation.getParent() != null ? fileStorageLocation.getParent() : fileStorageLocation));
        
        try {
            Files.createDirectories(fileStorageLocation);
            System.out.println("Directory created/verified successfully");
            System.out.println("=== END FILE STORAGE DEBUG ===");
        } catch (Exception ex) {
            System.err.println("=== FILE STORAGE ERROR ===");
            System.err.println("Failed to create directory: " + fileStorageLocation.toAbsolutePath());
            System.err.println("Error: " + ex.getMessage());
            System.err.println("=== END FILE STORAGE ERROR ===");
            throw new RuntimeException(
                "Could not create the directory where the uploaded files will be stored. " +
                "Path: " + fileStorageLocation.toAbsolutePath() + ". " +
                "Error: " + ex.getMessage() + ". " +
                "Please check the 'file.upload-dir' property in application.properties and ensure the directory path is correct and writable.", 
                ex
            );
        }
        return fileStorageLocation;
    }

    public String storeFile(MultipartFile file, String subDirectory) {
        if (file.isEmpty()) {
            throw new RuntimeException("Failed to store empty file");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !isValidFileType(contentType)) {
            throw new RuntimeException("Invalid file type. Only PDF, DOC, DOCX, and image files are allowed.");
        }

        try {
            // Create subdirectory if specified
            Path targetLocation = getFileStorageLocation();
            if (subDirectory != null && !subDirectory.isEmpty()) {
                targetLocation = targetLocation.resolve(subDirectory);
                Files.createDirectories(targetLocation);
            }

            // Generate unique filename
            String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
            String fileExtension = getFileExtension(originalFileName);
            String fileName = UUID.randomUUID().toString() + fileExtension;

            // Copy file to target location
            Path targetPath = targetLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            // Return relative path for database storage
            if (subDirectory != null && !subDirectory.isEmpty()) {
                return subDirectory + "/" + fileName;
            }
            return fileName;

        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + file.getOriginalFilename() + ". Please try again!", ex);
        }
    }

    public Resource loadFileAsResource(String fileName) {
        try {
            // Normalize and validate path to prevent directory traversal attacks
            Path filePath = getFileStorageLocation().resolve(fileName).normalize();
            
            // Security check: Ensure the resolved path is still within the upload directory
            Path storageLocation = getFileStorageLocation().normalize();
            if (!filePath.startsWith(storageLocation)) {
                throw new RuntimeException("Access denied: Path outside upload directory");
            }
            
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("File not found or not readable: " + fileName);
            }
        } catch (MalformedURLException ex) {
            throw new RuntimeException("File not found " + fileName, ex);
        }
    }

    // Load file as InputStream (for compatibility with S3FileStorageService interface)
    public InputStream loadFileAsStream(String fileName) {
        try {
            Resource resource = loadFileAsResource(fileName);
            return resource.getInputStream();
        } catch (IOException ex) {
            throw new RuntimeException("File not found " + fileName, ex);
        }
    }

    // Get public file URL (same as getFileUrl for local storage)
    public String getPublicFileUrl(String fileName) {
        return getFileUrl(fileName);
    }

    public boolean deleteFile(String fileName) {
        try {
            Path filePath = getFileStorageLocation().resolve(fileName).normalize();
            return Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            throw new RuntimeException("Could not delete file " + fileName, ex);
        }
    }

    public String getFileUrl(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return null;
        }
        // Return full URL with backend host and port for React frontend
        // Uses configurable base URL from application.properties
        return baseUrl + "/api/files/" + fileName;
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

    public long getFileSize(String fileName) {
        try {
            Path filePath = getFileStorageLocation().resolve(fileName).normalize();
            return Files.size(filePath);
        } catch (IOException ex) {
            return 0;
        }
    }

    public String getContentType(String fileName) {
        try {
            Path filePath = getFileStorageLocation().resolve(fileName).normalize();
            return Files.probeContentType(filePath);
        } catch (IOException ex) {
            return "application/octet-stream";
        }
    }
}
