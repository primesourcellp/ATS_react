# OpenAI Integration Setup Guide

This guide will help you set up OpenAI integration for the TalentPrime chatbot.

## Prerequisites

1. An OpenAI account (sign up at https://platform.openai.com/)
2. An OpenAI API key (get it from https://platform.openai.com/api-keys)

## Setup Steps

### 1. Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the API key (you won't be able to see it again!)

### 2. Configure the API Key

1. Open `src/main/resources/application.properties`
2. Find the line: `openai.api-key=your-openai-api-key-here`
3. Replace `your-openai-api-key-here` with your actual API key:
   ```
   openai.api-key=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 3. Optional: Configure Model Settings

You can customize the OpenAI model settings in `application.properties`:

```properties
# Model to use (options: gpt-4, gpt-4-turbo, gpt-3.5-turbo, gpt-4o-mini)
openai.model=gpt-4o-mini

# Maximum tokens in response (default: 1000)
openai.max-tokens=1000

# Temperature (0.0-2.0, lower = more focused, default: 0.7)
openai.temperature=0.7
```

**Recommended Models:**
- `gpt-4o-mini` - Fast and cost-effective (recommended for most use cases)
- `gpt-3.5-turbo` - Good balance of speed and quality
- `gpt-4` - Best quality but slower and more expensive
- `gpt-4-turbo` - Enhanced version of GPT-4

### 4. Restart the Application

After updating `application.properties`, restart your Spring Boot application for the changes to take effect.

## How It Works

The chatbot now uses OpenAI to:
1. **Understand natural language questions** about your ATS database
2. **Query the database** to get relevant information
3. **Generate intelligent responses** based on the data

### Database Context

The chatbot automatically includes:
- Summary statistics (total candidates, jobs, applications)
- Recent candidates (last 10)
- Active jobs (last 10)
- Recent applications (last 10)
- Status distributions for candidates and applications

### Example Questions You Can Ask

- "How many candidates do we have?"
- "Show me the active jobs"
- "What's the status of recent applications?"
- "How many candidates are in PENDING status?"
- "Tell me about candidates added today"
- "What jobs are available in Chennai?"

## Troubleshooting

### Error: "I encountered an issue: ..."

**Possible causes:**
1. **Invalid API Key**: Make sure your API key is correct and active
2. **API Key Not Set**: Check that `openai.api-key` is set in `application.properties`
3. **Insufficient Credits**: Check your OpenAI account balance at https://platform.openai.com/account/billing
4. **Rate Limits**: You may have hit OpenAI's rate limits. Wait a few minutes and try again.

### Error: "Service error: ..."

This usually means:
- The OpenAI service is temporarily unavailable
- There's a network connectivity issue
- The API key has expired or been revoked

### Check API Key Status

1. Go to https://platform.openai.com/api-keys
2. Verify your API key is active
3. Check your usage and billing at https://platform.openai.com/usage

## Cost Considerations

OpenAI charges based on:
- **Model used** (gpt-4o-mini is cheapest, gpt-4 is most expensive)
- **Tokens used** (input + output)
- **Number of requests**

**Estimated costs (as of 2024):**
- GPT-4o-mini: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- GPT-3.5-turbo: ~$0.50 per 1M input tokens, ~$1.50 per 1M output tokens
- GPT-4: ~$30 per 1M input tokens, ~$60 per 1M output tokens

**Tip**: Start with `gpt-4o-mini` for cost-effective testing, then upgrade if needed.

## Security Notes

⚠️ **Important**: Never commit your API key to version control!

- The `.gitignore` should exclude `application.properties` or use environment variables
- Consider using environment variables for production:
  ```properties
  openai.api-key=${OPENAI_API_KEY}
  ```
  Then set `OPENAI_API_KEY` as an environment variable.

## Support

If you encounter issues:
1. Check the application logs for detailed error messages
2. Verify your API key at https://platform.openai.com/api-keys
3. Check OpenAI status at https://status.openai.com/

