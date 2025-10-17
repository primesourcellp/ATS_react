# File Storage Implementation Guide

## Overview
The application has been updated to store resume files in the filesystem instead of the database. This improves performance and makes file management easier.

## Changes Made

### 1. Entity Models Updated
- **Candidate.java**: Changed from `byte[] resumePdf` to `String resumePath`
- **JobApplication.java**: Changed from `byte[] applicationResume` to `String applicationResumePath`
- **WebsiteApplicationForm.java**: Already uses `String resumePath` (no changes needed)

### 2. DTOs Updated
- **CandidateDTO.java**: Added `resumePath` and `resumeUrl` fields
- **JobApplicationDTO.java**: Added `applicationResumePath` and `applicationResumeUrl` fields
- **CandidateDetailsDTO.java**: Updated to use `resumePath` and `resumeUrl`

### 3. New Services Created
- **FileStorageService.java**: Handles all file operations (upload, download, delete)
  - Stores files in configurable directory (default: `uploads/`)
  - Generates unique filenames using UUID
  - Validates file types (PDF, DOC, DOCX, images)
  - Supports subdirectories for organization

### 4. New Controllers Created
- **FileController.java**: REST API for file operations
  - `POST /api/files/upload` - Upload a file
  - `GET /api/files/{fileName}` - Download/view a file
  - `DELETE /api/files/{fileName}` - Delete a file

### 5. Services Updated
- **CandidateService.java**: 
  - `createCandidate()` now stores resume in `uploads/resumes/candidates/`
  - `updateCandidatePartial()` deletes old resume and stores new one
  
- **JobApplicationService.java**:
  - `createApplication()` stores resume in `uploads/resumes/applications/`
  - `updateApplication()` deletes old resume and stores new one
  - `getResumePath()` returns file path instead of bytes

### 6. Controllers Updated
- **JobApplicationController.java**:
  - Changed `/api/applications/{id}/resume/view` to `/api/applications/{id}/resume/path`
  - Now returns JSON with `resumePath` and `resumeUrl`

### 7. Configuration
Added to `application.properties`:
```properties
# File Upload Configuration
file.upload-dir=uploads
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

## File Storage Structure
```
uploads/
├── resumes/
│   ├── candidates/
│   │   ├── {uuid}.pdf
│   │   ├── {uuid}.docx
│   │   └── ...
│   └── applications/
│       ├── {uuid}.pdf
│       └── ...
└── ...
```

## API Usage Examples

### 1. Upload a File
```bash
POST /api/files/upload
Content-Type: multipart/form-data

Parameters:
- file: (file) The file to upload
- subDirectory: (optional) Subdirectory path (e.g., "resumes/candidates")

Response:
{
  "fileName": "resumes/candidates/123e4567-e89b-12d3-a456-426614174000.pdf",
  "fileUrl": "/api/files/resumes/candidates/123e4567-e89b-12d3-a456-426614174000.pdf",
  "originalFileName": "john_doe_resume.pdf",
  "fileSize": 245678,
  "contentType": "application/pdf"
}
```

### 2. Download/View a File
```bash
GET /api/files/resumes/candidates/123e4567-e89b-12d3-a456-426614174000.pdf

Response: File content with appropriate Content-Type header
```

### 3. Create Candidate with Resume
```bash
POST /api/candidates
Content-Type: multipart/form-data

Parameters:
- candidate: (JSON) Candidate data
- resumeFile: (file) Resume file

The resume will be automatically stored in uploads/resumes/candidates/
```

### 4. Get Resume Path for Job Application
```bash
GET /api/applications/{id}/resume/path

Response:
{
  "resumePath": "resumes/applications/123e4567-e89b-12d3-a456-426614174000.pdf",
  "resumeUrl": "/api/files/resumes/applications/123e4567-e89b-12d3-a456-426614174000.pdf"
}
```

## Frontend Integration

### Display Resume in Browser
```javascript
// Get resume path
const response = await fetch(`/api/applications/${applicationId}/resume/path`);
const { resumeUrl } = await response.json();

// Display in iframe or open in new tab
document.getElementById('resumeViewer').src = resumeUrl;
// OR
window.open(resumeUrl, '_blank');
```

### Upload Resume
```javascript
const formData = new FormData();
formData.append('file', resumeFile);
formData.append('subDirectory', 'resumes/candidates');

const response = await fetch('/api/files/upload', {
  method: 'POST',
  body: formData
});

const { fileName, fileUrl } = await response.json();
```

## Database Migration

### Before Migration
The database stored resume files as LONGBLOB:
```sql
ALTER TABLE candidate DROP COLUMN resume;
ALTER TABLE job_application DROP COLUMN resume;
```

### After Migration
The database stores file paths as VARCHAR:
```sql
ALTER TABLE candidate ADD COLUMN resume_path VARCHAR(500);
ALTER TABLE job_application ADD COLUMN resume_path VARCHAR(500);
```

**Note**: Spring Boot with `ddl-auto=update` will handle this automatically.

## Benefits

1. **Performance**: 
   - Database queries are faster (no large binary data)
   - Files can be served directly by web server (Nginx, Apache)
   
2. **Storage**:
   - Easier to backup files separately
   - Can use CDN for file delivery
   - Easier to manage disk space

3. **Scalability**:
   - Can move files to cloud storage (S3, Azure Blob)
   - Can implement caching strategies
   
4. **Maintenance**:
   - Easier to view/manage files directly
   - Can implement file versioning
   - Easier to clean up old files

## Security Considerations

1. **File Type Validation**: Only PDF, DOC, DOCX, and images are allowed
2. **Unique Filenames**: UUID prevents filename conflicts and guessing
3. **Path Traversal Protection**: File paths are normalized
4. **Size Limits**: Maximum 10MB per file

## Future Enhancements

1. **Cloud Storage Integration**: 
   - Add AWS S3 or Azure Blob Storage support
   - Implement FileStorageService interface with multiple implementations

2. **File Versioning**:
   - Keep history of resume updates
   - Allow rollback to previous versions

3. **Thumbnail Generation**:
   - Generate thumbnails for PDF files
   - Preview images for documents

4. **Virus Scanning**:
   - Integrate antivirus scanning before storing files

5. **CDN Integration**:
   - Serve files through CDN for better performance
   - Implement signed URLs for secure access

## Troubleshooting

### Files Not Uploading
- Check `uploads/` directory exists and has write permissions
- Verify file size is under 10MB limit
- Check file type is allowed (PDF, DOC, DOCX, images)

### Files Not Found
- Verify file path in database matches actual file location
- Check `file.upload-dir` configuration in application.properties
- Ensure web server has read permissions on uploads directory

### Database Errors
- Run `spring.jpa.hibernate.ddl-auto=update` to auto-migrate schema
- Or manually update database schema to use VARCHAR instead of LONGBLOB

