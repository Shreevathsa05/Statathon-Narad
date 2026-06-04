# Langfuse Integration Guide

## Overview
Langfuse is integrated into your AI backend to provide comprehensive tracing, monitoring, and observability for all LLM model calls and agent executions. This helps you track:
- Model performance and latency
- Token usage and costs
- Agent execution flows
- Errors and debugging information
- Input/output data for auditing

## Setup

### 1. Get Langfuse Credentials
1. Go to [Langfuse Cloud](https://cloud.langfuse.com/)
2. Sign up for a free account
3. Create a new project
4. Get your **Public Key** and **Secret Key** from the project settings

### 2. Environment Configuration
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```

Add your Langfuse credentials:
```
LANGFUSE_PUBLIC_KEY=your_public_key_from_langfuse
LANGFUSE_SECRET_KEY=your_secret_key_from_langfuse
LANGFUSE_ENABLED=true
```

### 3. How It Works

#### OpenTelemetry Integration (index.js)
- The Node SDK automatically captures traces using OpenTelemetry
- `LangfuseSpanProcessor` forwards traces to Langfuse
- Runs automatically on server startup

#### LangChain Integration (agents.js)
- All agent invocations include `callbacks: [langfuseHandler]`
- Tracks:
  - Context Collector Agent
  - Section Planner Agent
  - Question Generator Agent
  - Improve Section Agent
  - Multilang Translator Agent
  - Prompt Validation Agent

#### Model Configuration (llms.js)
- ChatOpenAI model is initialized with Langfuse support
- All model calls are automatically traced

## Features Captured

### Agent Traces
- **Agent Name**: Which agent executed (e.g., "context_collector_agent")
- **Input**: User query, context, and configuration
- **Output**: Generated content and decisions
- **Duration**: Execution time
- **Status**: Success/failure

### Model Calls
- **Model**: gpt-4-turbo
- **Tokens Used**: Input and output tokens
- **Temperature & Parameters**: Model configuration
- **Cost**: Estimated cost calculation
- **Latency**: Response time

### Tool Usage
- **MCP Tools**: All tool invocations are tracked
- **Tool Results**: Inputs and outputs for debugging

## Viewing Traces

1. Go to [Langfuse Cloud Dashboard](https://cloud.langfuse.com/dashboard)
2. Select your project
3. Click "Traces" to see:
   - All LLM calls with timing and tokens
   - Agent execution flows
   - Error tracking
   - Performance metrics

## Disabling Langfuse

To disable tracing without removing the code:
```
LANGFUSE_ENABLED=false
```

## Custom Trace Metadata

To add custom metadata to traces, you can enhance the callbacks in agents.js:

```javascript
const res = await collector.invoke(messages, { 
    recursionLimit: 100,
    callbacks: [langfuseHandler],
    metadata: {
        surveyId: surveyId,
        userId: "user-123"
    }
});
```

## Troubleshooting

### Traces Not Appearing
1. Check that `LANGFUSE_ENABLED=true`
2. Verify credentials are correct
3. Check browser console for errors
4. Ensure server restarted after .env changes

### Performance Impact
- Langfuse adds minimal overhead (~5-10ms per request)
- Traces are sent asynchronously
- Disable if needed with `LANGFUSE_ENABLED=false`

## Best Practices

1. **Tag Surveys**: Include surveyId in trace metadata for easier debugging
2. **Monitor Costs**: Use Langfuse dashboard to track OpenAI API costs
3. **Set Alerts**: Configure Langfuse alerts for high latency or errors
4. **Regular Cleanup**: Archive old traces to maintain dashboard performance
5. **Use Sampling**: For high-volume applications, consider sampling traces

## API Documentation
- [Langfuse Docs](https://docs.langfuse.com/)
- [Langchain Integration](https://docs.langfuse.com/integrations/langchain/)
- [OpenTelemetry Integration](https://docs.langfuse.com/integrations/opentelemetry/)
