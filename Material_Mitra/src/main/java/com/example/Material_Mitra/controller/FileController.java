package com.example.Material_Mitra.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

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
            String fileName = fileStorageService.storeFile(file, subDirectory);
            String fileUrl = fileStorageService.getFileUrl(fileName);
            long fileSize = fileStorageService.getFileSize(fileName);
            
            return ResponseEntity.ok().body(new FileUploadResponse(
                fileName, 
                fileUrl, 
                file.getOriginalFilename(),
                fileSize,
                file.getContentType()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error uploading file: " + e.getMessage());
        }
    }

    @GetMapping("/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable String fileName, 
            HttpServletRequest request) {
        
        try {
            Resource resource = fileStorageService.loadFileAsResource(fileName);
            String contentType = fileStorageService.getContentType(fileName);
            
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                    .body(resource);
                    
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
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
