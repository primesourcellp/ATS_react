# Production Testing Guide

## 🎉 **Great News!**
Your frontend is already deployed and making requests to the production API! I can see from the request headers that:

- **Frontend URL**: `https://ats.primesourcellp.com/`
- **API URL**: `https://api.primesourcellp.com/api`
- **Request**: Creating admin user

## 🔍 **Current Status**

### ✅ **What's Working:**
- Frontend is deployed and accessible
- API calls are being made to production endpoint
- CORS is configured (request is going through)

### 🔧 **Testing Checklist**

#### 1. **Admin Registration**
- **URL**: `https://api.primesourcellp.com/api/users/create-admin`
- **Status**: ✅ Request is being made
- **Test**: Try creating an admin user

#### 2. **Login Functionality**
- **URL**: `https://api.primesourcellp.com/api/auth/login`
- **Test**: Login with admin credentials

#### 3. **Dashboard Statistics**
- **URLs**: 
  - `https://api.primesourcellp.com/jobs/counts`
  - `https://api.primesourcellp.com/api/candidates/count`
  - `https://api.primesourcellp.com/api/interviews/count/today`
  - `https://api.primesourcellp.com/api/applications/count`

#### 4. **Core Features**
- [ ] Candidate management
- [ ] Job management
- [ ] Interview scheduling
- [ ] File uploads/downloads
- [ ] Notifications
- [ ] Password reset

## 🚨 **Common Issues & Solutions**

### 1. **CORS Errors**
If you see CORS errors in browser console:
```javascript
// Backend needs to allow your frontend domain
@CrossOrigin(origins = "https://ats.primesourcellp.com")
```

### 2. **Authentication Issues**
- Check if JWT tokens are being stored correctly
- Verify token expiration
- Ensure logout functionality works

### 3. **File Upload Issues**
- Check file size limits
- Verify file storage configuration
- Test resume upload/download

### 4. **Database Connection**
- Ensure RDS is accessible
- Check security groups
- Verify database credentials

## 🔧 **Backend Configuration Needed**

Make sure your backend has these configurations:

### 1. **CORS Configuration**
```java
@CrossOrigin(origins = {
    "https://ats.primesourcellp.com",
    "http://localhost:3000" // for development
})
```

### 2. **Environment Variables**
```properties
# Production database
spring.datasource.url=jdbc:mysql://your-rds-endpoint:3306/Material_Mitra
spring.datasource.username=admin
spring.datasource.password=your-password

# Email configuration
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
```

### 3. **File Upload Configuration**
```properties
file.upload-dir=/opt/material-mitra/uploads
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

## 📊 **Monitoring & Debugging**

### 1. **Browser Developer Tools**
- **Network Tab**: Check API requests/responses
- **Console Tab**: Look for JavaScript errors
- **Application Tab**: Check localStorage for JWT tokens

### 2. **Backend Logs**
```bash
# Check application logs
sudo journalctl -u material-mitra -f

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

### 3. **Database Monitoring**
- Check RDS performance metrics
- Monitor connection counts
- Verify query performance

## 🚀 **Next Steps**

### 1. **Complete Testing**
- Test all major features
- Verify data persistence
- Check error handling

### 2. **Performance Optimization**
- Enable gzip compression
- Set up CDN if needed
- Optimize database queries

### 3. **Security Hardening**
- Enable HTTPS only
- Set up proper CORS
- Implement rate limiting
- Regular security updates

### 4. **Monitoring Setup**
- Set up application monitoring
- Configure error tracking
- Set up uptime monitoring

## 🆘 **Troubleshooting Commands**

### Check Backend Status
```bash
# Check if service is running
sudo systemctl status material-mitra

# Check if port 8080 is listening
sudo netstat -tlnp | grep :8080

# Check nginx status
sudo systemctl status nginx
```

### Check Database Connection
```bash
# Test database connection
mysql -h your-rds-endpoint -u admin -p

# Check database
USE Material_Mitra;
SHOW TABLES;
```

### Check File Permissions
```bash
# Check upload directory
ls -la /opt/material-mitra/uploads/

# Fix permissions if needed
sudo chown -R ec2-user:ec2-user /opt/material-mitra/uploads/
```

## 📞 **Support**

If you encounter issues:

1. **Check browser console** for errors
2. **Check backend logs** for server errors
3. **Verify database connectivity**
4. **Test API endpoints** directly with Postman/curl
5. **Check security groups** and firewall rules

## 🎯 **Success Indicators**

Your deployment is successful when:
- ✅ Frontend loads without errors
- ✅ Admin registration works
- ✅ Login/logout functions properly
- ✅ Dashboard shows correct statistics
- ✅ All CRUD operations work
- ✅ File uploads/downloads work
- ✅ Email notifications work
- ✅ No console errors in browser

Your application appears to be working well! The fact that requests are being made to the production API is a great sign. Continue testing the core functionality to ensure everything is working as expected.
