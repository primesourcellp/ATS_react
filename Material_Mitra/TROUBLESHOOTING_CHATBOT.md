# Chatbot Troubleshooting Guide

If the chatbot is not working, follow these steps to diagnose and fix the issue:

## Step 1: Check Application Logs

When you send a message to the chatbot, check your Spring Boot console/logs for error messages. Look for:
- "ERROR: OpenAI API key is not configured"
- "OpenAI HTTP Error"
- "Timeout error"
- "Network error"

## Step 2: Verify API Key Configuration

1. Open `src/main/resources/application.properties`
2. Check that `openai.api-key` is set and NOT equal to `your-openai-api-key-here`
3. The API key should start with `sk-` or `sk-proj-`
4. Make sure there are no extra spaces or quotes around the API key

Example:
```properties
openai.api-key=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 3: Test the Health Endpoint

1. Start your Spring Boot application
2. Open your browser or use Postman/curl
3. Make a GET request to: `http://localhost:8080/api/chatbot/health`
4. Check the response - it should show `"openai": "configured"` if working

## Step 4: Common Issues and Solutions

### Issue: "OpenAI API key is not configured"
**Solution:**
- Make sure `openai.api-key` is set in `application.properties`
- Restart the Spring Boot application after changing the property
- Check that the property name is exactly `openai.api-key` (with hyphen, not underscore)

### Issue: "Authentication failed" (401 error)
**Solution:**
- Your API key might be invalid or expired
- Go to https://platform.openai.com/api-keys and verify your key is active
- Generate a new API key if needed
- Make sure you copied the entire key (they can be very long)

### Issue: "Rate limit exceeded" (429 error)
**Solution:**
- You've hit OpenAI's rate limits
- Wait a few minutes and try again
- Check your usage at https://platform.openai.com/usage
- Consider upgrading your OpenAI plan if you need higher limits

### Issue: "Network error" or "Timeout"
**Solution:**
- Check your internet connection
- Check if OpenAI is down: https://status.openai.com/
- Your firewall might be blocking the connection
- Try increasing timeout settings (if applicable)

### Issue: "Request timed out"
**Solution:**
- The database context might be too large
- Try reducing the amount of data sent (the service sends recent candidates/jobs/applications)
- Check your internet connection speed

### Issue: Application won't start
**Solution:**
- Check if Maven dependencies are downloaded correctly
- Run: `mvn clean install` in the Material_Mitra directory
- Check for compilation errors in the console

## Step 5: Test with a Simple Message

Try sending a simple message like "hello" or "test" to see if you get any response. This helps isolate whether the issue is with:
- API connectivity
- Database queries
- Response processing

## Step 6: Check Database Connection

The chatbot needs to query your database to provide context. Make sure:
- Your database is running
- The connection settings in `application.properties` are correct
- You can access the database from your application

## Step 7: Verify Dependencies

Make sure the OpenAI dependency is downloaded:
```bash
cd Material_Mitra
mvn dependency:tree | grep openai
```

You should see:
```
com.theokanning.openai-gpt3-java:service:jar:0.18.2
```

## Step 8: Enable Debug Logging

Add this to `application.properties` to see more detailed logs:
```properties
logging.level.com.example.Material_Mitra.service.ChatbotService=DEBUG
logging.level.com.example.Material_Mitra.controller.ChatbotController=DEBUG
```

## Still Not Working?

1. **Check the exact error message** in the chatbot response or application logs
2. **Verify your OpenAI account** has credits/balance at https://platform.openai.com/account/billing
3. **Test the API key directly** using OpenAI's API documentation or a tool like Postman
4. **Check Spring Boot startup logs** for any initialization errors

## Quick Test

To quickly test if everything is set up correctly:

1. Start your Spring Boot application
2. Open the chatbot in your frontend
3. Send a message: "How many candidates do we have?"
4. Check:
   - Frontend: Does it show an error message?
   - Backend logs: Are there any error messages?
   - Network tab: What HTTP status code is returned?

## Contact Support

If none of these steps resolve the issue, provide:
- The exact error message from the chatbot
- The error logs from Spring Boot console
- The HTTP status code from the network request
- Your `application.properties` (with API key redacted)

