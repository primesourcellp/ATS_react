#!/bin/bash

# Test script for file upload functionality
# Make sure the Spring Boot application is running before executing this script

BASE_URL="http://localhost:8080"

echo "=== Testing File Storage System ==="
echo ""

# Test 1: Upload a file
echo "Test 1: Uploading a test file..."
curl -X POST "$BASE_URL/api/files/upload" \
  -F "file=@test-resume.pdf" \
  -F "subDirectory=resumes/test" \
  -H "Content-Type: multipart/form-data"
echo ""
echo ""

# Test 2: Create a candidate with resume
echo "Test 2: Creating a candidate with resume..."
curl -X POST "$BASE_URL/api/candidates" \
  -F "candidate={\"name\":\"John Doe\",\"email\":\"john@example.com\",\"phone\":\"9876543210\",\"skills\":\"Java, Spring Boot\",\"experience\":\"5 years\"};type=application/json" \
  -F "resumeFile=@test-resume.pdf" \
  -H "Content-Type: multipart/form-data"
echo ""
echo ""

# Test 3: Get all candidates
echo "Test 3: Getting all candidates..."
curl -X GET "$BASE_URL/api/candidates"
echo ""
echo ""

# Test 4: Download a file (replace {fileName} with actual file name from Test 1)
# echo "Test 4: Downloading a file..."
# curl -X GET "$BASE_URL/api/files/resumes/test/{fileName}" -o downloaded-resume.pdf
# echo "File downloaded as downloaded-resume.pdf"
# echo ""

echo "=== Tests Complete ==="
echo ""
echo "Note: Make sure to replace {fileName} in Test 4 with the actual file name returned from Test 1"

