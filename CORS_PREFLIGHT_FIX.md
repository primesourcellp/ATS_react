# CORS Preflight Issue Fix

## 🚨 **Problem Identified**

Your CORS preflight request (OPTIONS) is not completing successfully, which is preventing the actual POST request from being sent. The "Provisional headers" warning indicates the preflight request failed.

## 🔍 **Root Cause**

The backend at `https://api.primesourcellp.com` is not properly handling the CORS preflight request, likely because:

1. **Backend not running** at the expected URL
2. **CORS configuration** not working properly
3. **OPTIONS method** not being handled correctly

## 🚀 **Solutions**

### **Solution 1: Fix Backend CORS Configuration**

Update your SecurityConfig to ensure OPTIONS requests are handled properly:

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    
    // Allow your frontend domain
    config.setAllowedOrigins(List.of("https://ats.primesourcellp.com"));
    
    // Allow all necessary methods
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
    
    // Allow all headers
    config.setAllowedHeaders(List.of("*"));
    
    // Allow credentials
    config.setAllowCredentials(true);
    
    // Cache preflight for 1 hour
    config.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

### **Solution 2: Add Global CORS Configuration**

Add this to your main application class:

```java
@RestController
@CrossOrigin(origins = "https://ats.primesourcellp.com")
public class YourController {
    // Your controllers
}
```

### **Solution 3: Use Same Domain (Quick Fix)**

If the backend is not accessible at `api.primesourcellp.com`, use the same domain:

#### 1. **Update Frontend Configuration**
```javascript
// In src/config/api.js
export const API_CONFIG = {
  BASE_URL: "https://ats.primesourcellp.com/api",
  TIMEOUT: 10000,
};
```

#### 2. **Deploy Backend to Same Server**
- Deploy your Spring Boot backend to the same server as your frontend
- Use the .htaccess proxy we already configured

### **Solution 4: Test Backend Directly**

First, verify if your backend is running:

```bash
# Test if backend is accessible
curl -X OPTIONS https://api.primesourcellp.com/api/users/create-admin \
  -H "Origin: https://ats.primesourcellp.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"

# Should return 200 OK with CORS headers
```

## 🔧 **Immediate Fix Steps**

### **Step 1: Check Backend Status**
```bash
# Test backend directly
curl https://api.primesourcellp.com/api/users/create-admin
```

### **Step 2: Update CORS Configuration**
Make sure your SecurityConfig has:

```java
.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
```

### **Step 3: Redeploy Backend**
```bash
cd Material_Mitra
mvn clean package -DskipTests
java -jar target/Material_Mitra-0.0.1-SNAPSHOT.jar
```

### **Step 4: Test Again**
Try creating the admin user again from your frontend.

## 🧪 **Alternative: Use Same Domain**

If you can't fix the CORS issue immediately, use the same domain:

### **1. Update Frontend API Configuration**
```javascript
// Update all API files to use same domain
const BASE_URL = "https://ats.primesourcellp.com/api";
```

### **2. Deploy Backend to Same Server**
- Deploy Spring Boot to the same server as your frontend
- Use the .htaccess proxy configuration

### **3. Test**
The CORS issue should be resolved since both frontend and backend are on the same domain.

## 🎯 **Expected Results**

After fixing the CORS issue:
- ✅ OPTIONS request should return 200 OK
- ✅ POST request should be sent automatically
- ✅ Admin user should be created successfully
- ✅ No more "Provisional headers" warning

## 🆘 **Quick Test Commands**

```bash
# Test OPTIONS request
curl -X OPTIONS https://api.primesourcellp.com/api/users/create-admin \
  -H "Origin: https://ats.primesourcellp.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"

# Test POST request
curl -X POST https://api.primesourcellp.com/api/users/create-admin \
  -H "Content-Type: application/json" \
  -H "Origin: https://ats.primesourcellp.com" \
  -d '{"username":"admin","password":"password123","email":"admin@test.com"}'
```

The main issue is that your CORS preflight request is failing. Fix the backend CORS configuration or use the same domain approach to resolve this issue.
