package com.example.Material_Mitra.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile; // Using local file storage instead

import com.example.Material_Mitra.service.FileStorageService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileController {

    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "subDirectory", required = false) String subDirectory) {
        
        try {
            // Store file locally (AWS S3 code commented out)
            String fileName = fileStorageService.storeFile(file, subDirectory);
            String fileUrl = fileStorageService.getFileUrl(fileName);
            
            return ResponseEntity.ok().body(new FileUploadResponse(
                fileName, 
                fileUrl, 
                file.getOriginalFilename(),
                file.getSize(),
                file.getContentType()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error uploading file: " + e.getMessage());
        }
    }

    @GetMapping("/**")
    public ResponseEntity<?> downloadFile(HttpServletRequest request) {
        
        try {
            // Get the full path including any subdirectories
            String requestUri = request.getRequestURI();
            String fullPath = requestUri.replace("/api/files/", "");
            
            // Decode URL encoding if present
            try {
                if (fullPath.contains("%")) {
                    fullPath = java.net.URLDecoder.decode(fullPath, "UTF-8");
                }
            } catch (Exception decodeEx) {
                // If decoding fails, use original path
            }
            
            // Load file from local storage
            Resource resource = fileStorageService.loadFileAsResource(fullPath);
            String contentType = fileStorageService.getContentType(fullPath);
            
            // Get filename from path for display
            String displayFileName = fullPath;
            if (fullPath.contains("/")) {
                displayFileName = fullPath.substring(fullPath.lastIndexOf('/') + 1);
            }
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + displayFileName + "\"")
                    .header(HttpHeaders.CONTENT_TYPE, contentType != null ? contentType : "application/pdf")
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                    .header(HttpHeaders.PRAGMA, "no-cache")
                    .header(HttpHeaders.EXPIRES, "0")
                    .body(resource);
                    
        } catch (Exception e) {
            e.printStackTrace(); // Log the error for debugging
            return ResponseEntity.status(404).body("File not found: " + e.getMessage());
        }
    }

    @DeleteMapping("/{fileName:.+}")
    public ResponseEntity<?> deleteFile(@PathVariable String fileName) {
        try {
            boolean deleted = fileStorageService.deleteFile(fileName);
            if (deleted) {
                return ResponseEntity.ok().body("File deleted successfully");
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error deleting file: " + e.getMessage());
        }
    }

    // Response class for file upload
    public static class FileUploadResponse {
        private String fileName;
        private String fileUrl;
        private String originalFileName;
        private long fileSize;
        private String contentType;

        public FileUploadResponse(String fileName, String fileUrl, String originalFileName, long fileSize, String contentType) {
            this.fileName = fileName;
            this.fileUrl = fileUrl;
            this.originalFileName = originalFileName;
            this.fileSize = fileSize;
            this.contentType = contentType;
        }

        // Getters
        public String getFileName() { return fileName; }
        public String getFileUrl() { return fileUrl; }
        public String getOriginalFileName() { return originalFileName; }
        public long getFileSize() { return fileSize; }
        public String getContentType() { return contentType; }
    }
}
