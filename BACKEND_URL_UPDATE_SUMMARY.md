# Backend URL Update Summary

## ✅ **Changes Made**

All frontend API calls have been updated to use the same domain for both frontend and backend:
```
https://ats.primesourcellp.com/api
```

## 📁 **Files Updated**

### API Configuration Files:
- ✅ `src/config/api.js` - Centralized configuration
- ✅ `src/api/websiteapi.js`
- ✅ `src/api/userApi.js`
- ✅ `src/api/candidate.js`
- ✅ `src/api/jobApi.js`
- ✅ `src/api/application.js`
- ✅ `src/api/clientAPI.js`
- ✅ `src/api/interviewApi.js`
- ✅ `src/api/notificationApi.js`

### Component Files:
- ✅ `src/components/LoginRegister.jsx`
- ✅ `src/components/Dashboard.jsx`
- ✅ `src/components/notifications/NotificationCenter.jsx`
- ✅ `src/layout/navbar.jsx`
- ✅ `src/components/auth/ForgotPassword.jsx`
- ✅ `src/components/candidate/CandidateDetail.jsx`
- ✅ `src/components/job/CandidateDetailsModal.jsx`

## 🔧 **Backend Configuration Required**

Since you're now using the same domain (`https://ats.primesourcellp.com`) for both frontend and backend, you need to configure your backend to serve both:

### Option 1: Serve Backend API at `/api` path (Recommended)

Configure your backend to serve API endpoints at `https://ats.primesourcellp.com/api/*`

#### Spring Boot Configuration:
```java
@RestController
@RequestMapping("/api")
public class YourController {
    // Your endpoints will be available at /api/endpoint
}
```

#### Nginx Configuration:
```nginx
server {
    listen 443 ssl http2;
    server_name ats.primesourcellp.com;

    # Serve React frontend
    location / {
        root /var/www/ats.primesourcellp.com;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Spring Boot
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Option 2: Separate Subdomain (Alternative)

If you prefer to keep them separate, you could use:
- Frontend: `https://ats.primesourcellp.com`
- Backend: `https://api.ats.primesourcellp.com`

Then update the frontend configuration back to use the subdomain.

## 🚀 **Deployment Steps**

### 1. **Backend Deployment**
- Deploy your Spring Boot application to serve at `/api` path
- Configure Nginx to proxy `/api/*` requests to your Spring Boot app
- Ensure CORS is configured for the same domain

### 2. **Frontend Deployment**
- Build your React application:
  ```bash
  cd Ats_Frontend
  npm run build
  ```
- Upload the `dist/` folder contents to your web server
- Ensure `.htaccess` is configured for React Router

### 3. **CORS Configuration**
Since you're using the same domain, CORS should be simpler:

```java
@CrossOrigin(origins = "https://ats.primesourcellp.com")
```

Or if you want to allow all origins from the same domain:
```java
@CrossOrigin(origins = "https://ats.primesourcellp.com")
```

## 🔍 **Testing Checklist**

### 1. **API Endpoints**
- [ ] `https://ats.primesourcellp.com/api/auth/login`
- [ ] `https://ats.primesourcellp.com/api/users/create-admin`
- [ ] `https://ats.primesourcellp.com/api/candidates`
- [ ] `https://ats.primesourcellp.com/api/jobs`
- [ ] `https://ats.primesourcellp.com/api/notifications`

### 2. **Frontend Functionality**
- [ ] Login/Registration works
- [ ] Dashboard loads statistics
- [ ] CRUD operations work
- [ ] File uploads/downloads work
- [ ] Notifications work

### 3. **Network Testing**
```bash
# Test API endpoints
curl -X GET https://ats.primesourcellp.com/api/candidates
curl -X POST https://ats.primesourcellp.com/api/auth/login

# Test frontend
curl -X GET https://ats.primesourcellp.com/
```

## 🛠️ **Troubleshooting**

### Common Issues:

1. **404 Errors on API calls**
   - Check if backend is serving at `/api` path
   - Verify Nginx proxy configuration

2. **CORS Errors**
   - Ensure CORS is configured for the same domain
   - Check if preflight requests are handled

3. **Frontend not loading**
   - Check if React build files are in the correct directory
   - Verify `.htaccess` configuration

4. **API not responding**
   - Check if Spring Boot is running on port 8080
   - Verify Nginx is proxying correctly

## 📋 **Next Steps**

1. **Configure your backend** to serve at `/api` path
2. **Set up Nginx** to proxy API requests
3. **Deploy the updated frontend** with new API URLs
4. **Test all functionality** to ensure everything works
5. **Monitor logs** for any issues

## 💡 **Benefits of Same Domain Setup**

- ✅ **Simpler CORS configuration**
- ✅ **No cross-origin issues**
- ✅ **Easier SSL certificate management**
- ✅ **Better performance** (no additional DNS lookups)
- ✅ **Simpler deployment** (single domain to manage)

Your frontend is now configured to use `https://ats.primesourcellp.com/api` as the backend URL. Make sure your backend is configured to serve API endpoints at this path!
