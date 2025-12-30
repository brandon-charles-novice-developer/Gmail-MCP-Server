# Gmail-MCP-Server AI Setup Guide

Complete guide to configuring AI-powered email analysis capabilities in Gmail-MCP-Server.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (5 minutes)](#quick-start-5-minutes)
3. [Configuration Options](#configuration-options)
4. [Provider-Specific Setup](#provider-specific-setup)
5. [Cost Optimization](#cost-optimization)
6. [Testing Your Setup](#testing-your-setup)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

**Required**:
- Node.js 18+ and npm
- Gmail API OAuth credentials (configured via `~/.gmail-mcp/credentials.json`)
- At least one LLM provider API key (Anthropic, OpenAI, or Google)

**Recommended**:
- Anthropic API key (best quality for email analysis)
- Claude Sonnet 4.5 for context extraction
- Claude Haiku 4.5 for categorization (cost optimization)

---

## Quick Start (5 minutes)

### Step 1: Copy Environment Template

```bash
cd /Development/unified-workspace/Gmail-MCP-Server
cp .env.example .env
```

### Step 2: Get Anthropic API Key

1. Visit [Anthropic Console](https://console.anthropic.com/account/keys)
2. Sign up or log in
3. Click "Create Key"
4. Copy the key (starts with `sk-ant-api03-...`)

### Step 3: Configure .env

Edit `.env` and add your API key:

```bash
# Minimum required configuration
LLM_PROVIDER=anthropic
LLM_MODEL=claude-sonnet-4-5
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE

# Cost optimization (optional but recommended)
ECONOMY_LLM_PROVIDER=anthropic
ECONOMY_LLM_MODEL=claude-haiku-4-5
```

### Step 4: Install Dependencies & Build

```bash
npm install
npm run build
```

### Step 5: Test AI Tools

Start the MCP server:

```bash
npm start
```

Test with an MCP client (e.g., Claude Desktop, Claude Code):

```json
// Call categorize_email tool
{
  "name": "categorize_email",
  "arguments": {
    "messageId": "your_message_id_here"
  }
}
```

**Expected Response**:
```json
{
  "category": "NEWSLETTER",
  "confidence": 0.95,
  "reasoning": "Regular newsletter from TechCrunch with unsubscribe link",
  "suggestedLabels": ["Label_Newsletter"]
}
```

✅ If you see categorization results, AI is working!

---

## Configuration Options

### Model Tiers

Gmail-MCP-Server uses two tiers of models for cost optimization:

| Tier | Purpose | Tools | Recommended Model |
|------|---------|-------|-------------------|
| **Default** | Context extraction, complex analysis | `extract_email_context` | Claude Sonnet 4.5 |
| **Economy** | Categorization, cold detection | `categorize_email`, `detect_cold_email` | Claude Haiku 4.5 |

### Environment Variables

**Core Configuration**:
- `LLM_PROVIDER`: Primary provider (`anthropic`, `openai`, `google`)
- `LLM_MODEL`: Default tier model name
- `ECONOMY_LLM_PROVIDER`: Economy tier provider (defaults to LLM_PROVIDER)
- `ECONOMY_LLM_MODEL`: Economy tier model name (defaults to LLM_MODEL)

**Provider API Keys**:
- `ANTHROPIC_API_KEY`: Anthropic API key
- `OPENAI_API_KEY`: OpenAI API key
- `GOOGLE_AI_API_KEY`: Google AI API key

**Optimization Settings**:
- `CATEGORIZATION_CACHE_TTL`: Cache duration in seconds (default: 3600)
- `CACHE_COLD_SENDERS`: Permanently cache cold email senders (default: true)
- `MAX_BATCH_SIZE`: Maximum emails per batch request (default: 50)
- `LOG_TOKEN_USAGE`: Log token usage to console (default: true)
- `DEBUG_LLM_CALLS`: Log full LLM requests/responses (default: false)

---

## Provider-Specific Setup

### Anthropic Claude (Recommended)

**Why Claude?**
- ✅ Best quality for email analysis and context extraction
- ✅ Haiku tier extremely cost-effective for categorization ($0.30/$1.50 per 1M tokens)
- ✅ Sonnet tier excellent for nuanced understanding ($3/$15 per 1M tokens)
- ✅ Native structured output support

**Setup**:

1. **Get API Key**:
   - Visit: https://console.anthropic.com/account/keys
   - Create account or log in
   - Generate new API key

2. **Configure .env**:
   ```bash
   LLM_PROVIDER=anthropic
   LLM_MODEL=claude-sonnet-4-5
   ANTHROPIC_API_KEY=sk-ant-api03-...

   ECONOMY_LLM_PROVIDER=anthropic
   ECONOMY_LLM_MODEL=claude-haiku-4-5
   ```

3. **Available Models**:
   - `claude-opus-4-5` - Highest quality, $15/$75 per 1M tokens
   - `claude-sonnet-4-5` - Balanced quality/cost, $3/$15 per 1M tokens (recommended)
   - `claude-haiku-4-5` - Economy tier, $0.30/$1.50 per 1M tokens (recommended for economy)

**Expected Cost**: ~$0.09 per 100 emails (Haiku for categorization, Sonnet for context)

---

### OpenAI GPT (Alternative)

**Why OpenAI?**
- ✅ GPT-4o-mini extremely cheap ($0.15/$0.60 per 1M tokens)
- ✅ GPT-4o good quality for context extraction
- ⚠️ May require more structured prompting for email analysis

**Setup**:

1. **Get API Key**:
   - Visit: https://platform.openai.com/api-keys
   - Create account or log in
   - Generate new API key

2. **Configure .env**:
   ```bash
   LLM_PROVIDER=openai
   LLM_MODEL=gpt-4o
   OPENAI_API_KEY=sk-...

   ECONOMY_LLM_PROVIDER=openai
   ECONOMY_LLM_MODEL=gpt-4o-mini
   ```

3. **Available Models**:
   - `gpt-4o` - High quality, $2.50/$10 per 1M tokens (recommended default)
   - `gpt-4o-mini` - Economy tier, $0.15/$0.60 per 1M tokens (recommended economy)
   - `gpt-4-turbo` - Legacy, $10/$30 per 1M tokens

**Expected Cost**: ~$0.05 per 100 emails (4o-mini for categorization, 4o for context)

---

### Google Gemini (Alternative)

**Why Gemini?**
- ✅ Gemini 1.5 Flash cheapest option ($0.075/$0.30 per 1M tokens)
- ✅ Gemini 2.0 Flash good balance of speed/quality
- ⚠️ Context extraction quality may vary vs. Claude/GPT

**Setup**:

1. **Get API Key**:
   - Visit: https://aistudio.google.com/app/apikey
   - Create account or log in
   - Generate new API key

2. **Configure .env**:
   ```bash
   LLM_PROVIDER=google
   LLM_MODEL=gemini-2.0-flash-exp
   GOOGLE_AI_API_KEY=...

   ECONOMY_LLM_PROVIDER=google
   ECONOMY_LLM_MODEL=gemini-1.5-flash
   ```

3. **Available Models**:
   - `gemini-2.0-flash-exp` - Latest experimental, $0.10/$0.40 per 1M tokens (recommended default)
   - `gemini-1.5-pro` - High quality, $1.25/$5 per 1M tokens
   - `gemini-1.5-flash` - Economy tier, $0.075/$0.30 per 1M tokens (recommended economy)

**Expected Cost**: ~$0.02 per 100 emails (1.5 Flash for all operations)

---

## Cost Optimization

### Strategy 1: Hybrid Model Routing (Recommended)

Use economy tier for simple tasks, default tier for complex analysis:

```bash
# .env
LLM_PROVIDER=anthropic
LLM_MODEL=claude-sonnet-4-5          # Context extraction ($0.002/email)
ECONOMY_LLM_PROVIDER=anthropic
ECONOMY_LLM_MODEL=claude-haiku-4-5   # Categorization ($0.0004/email)
```

**Impact**: 3x cost reduction vs. using Sonnet for all operations

### Strategy 2: Aggressive Caching

Enable caching for repeated categorization:

```bash
# .env
CATEGORIZATION_CACHE_TTL=3600        # 1 hour cache
CACHE_COLD_SENDERS=true              # Permanent sender cache
```

**Impact**: ~60% cache hit rate → 2.5x cost reduction on repeat categorization

### Strategy 3: Selective Context Extraction

Only extract context for important emails:

```typescript
// In inbox-automation skill
if (category === "WORK" || category === "PERSONAL") {
  // Extract full context (expensive)
  const context = await extractEmailContext({ messageId });
} else {
  // Skip context extraction for newsletters/marketing
}
```

**Impact**: Extract context for ~20% of emails instead of 100% → 5x reduction

### Combined Impact

**Baseline** (Sonnet for all, no caching, all emails):
- 100 emails × $0.0105 = **$1.05**

**Optimized** (hybrid routing + caching + selective extraction):
- 100 emails categorized (60% cache) × $0.0004 = $0.04
- 20 emails context extracted × $0.002 = $0.04
- **Total: $0.08** (13x reduction)

---

## Testing Your Setup

### Test 1: Verify Configuration

```bash
npm start
```

Look for startup logs:
```
✅ LLM configured: anthropic/claude-sonnet-4-5 (default)
✅ LLM configured: anthropic/claude-haiku-4-5 (economy)
✅ MCP server started on stdio
```

### Test 2: Categorize Email

Use an MCP client to call the tool:

```json
{
  "name": "categorize_email",
  "arguments": {
    "messageId": "18d4f1e2a3b4c5d6"
  }
}
```

**Expected Output**:
```json
{
  "category": "NEWSLETTER",
  "confidence": 0.92,
  "reasoning": "Regular newsletter with unsubscribe link and digest format",
  "suggestedLabels": ["Label_Newsletter"]
}
```

### Test 3: Extract Context

```json
{
  "name": "extract_email_context",
  "arguments": {
    "messageId": "18d4f1e2a3b4c5d6",
    "maxHistoryMessages": 5
  }
}
```

**Expected Output**:
```json
{
  "summary": "Meeting request from Sarah Johnson (Amazon) for Q1 campaign discussion",
  "keyPoints": [
    "Proposed meeting dates: Jan 15-17, 2026",
    "Budget range: $500K-$750K",
    "Focus: Prime Video placement"
  ],
  "actionItems": [
    "Respond with availability by Dec 31",
    "Prepare campaign proposal deck",
    "Send preliminary budget breakdown"
  ],
  "people": [
    {
      "name": "Sarah Johnson",
      "email": "sarah@amazon.com",
      "role": "Sr. Manager, Prime Video Ads"
    }
  ],
  "dates": [
    {
      "date": "2026-01-15",
      "context": "Proposed meeting date option 1"
    }
  ],
  "relevantContext": "...",
  "confidence": 0.95
}
```

### Test 4: Batch Analysis

```json
{
  "name": "batch_analyze_emails",
  "arguments": {
    "messageIds": ["18d4f1e2a3b4c5d6", "27e5g2f3b4c5d6e7"],
    "analysisTypes": ["categorize", "cold_detection"]
  }
}
```

**Expected Output**:
```json
{
  "results": [
    {
      "messageId": "18d4f1e2a3b4c5d6",
      "category": {...},
      "coldDetection": {...}
    },
    {
      "messageId": "27e5g2f3b4c5d6e7",
      "category": {...},
      "coldDetection": {...}
    }
  ],
  "summary": "Analyzed 2 emails: 1 WORK, 1 COLD_EMAIL",
  "recommendedActions": [
    {
      "messageId": "27e5g2f3b4c5d6e7",
      "action": "ARCHIVE",
      "reasoning": "Cold sales email from unknown sender"
    }
  ]
}
```

### Test 5: Token Usage Logging

Check console output after tool calls:

```
📊 Token Usage: categorize_email
   Provider: anthropic/claude-haiku-4-5
   Input: 487 tokens
   Output: 142 tokens
   Cost: ~$0.00036

📊 Token Usage: extract_email_context
   Provider: anthropic/claude-sonnet-4-5
   Input: 1523 tokens
   Output: 398 tokens
   Cost: ~$0.01033
```

---

## Troubleshooting

### Error: "LLM provider not configured"

**Cause**: Missing API key or invalid provider name

**Fix**:
1. Check `.env` file exists in Gmail-MCP-Server directory
2. Verify `LLM_PROVIDER` is one of: `anthropic`, `openai`, `google`
3. Verify corresponding API key is set:
   - Anthropic: `ANTHROPIC_API_KEY=sk-ant-...`
   - OpenAI: `OPENAI_API_KEY=sk-...`
   - Google: `GOOGLE_AI_API_KEY=...`

### Error: "Invalid API key"

**Cause**: Expired or incorrect API key

**Fix**:
1. Verify API key in provider console
2. Check for extra spaces or newlines in `.env`
3. Regenerate API key if needed
4. Restart MCP server after updating `.env`

### Error: "Rate limit exceeded"

**Cause**: Too many requests to LLM provider

**Fix**:
1. **Anthropic**: Check usage at https://console.anthropic.com/account/usage
2. **OpenAI**: Check limits at https://platform.openai.com/account/limits
3. **Google**: Check quota at https://aistudio.google.com/app/apikey
4. Enable caching to reduce requests:
   ```bash
   CATEGORIZATION_CACHE_TTL=3600
   CACHE_COLD_SENDERS=true
   ```

### Error: "Model not found"

**Cause**: Invalid model name for provider

**Fix**:

**Anthropic models**:
- `claude-opus-4-5` ✅
- `claude-sonnet-4-5` ✅
- `claude-haiku-4-5` ✅
- NOT: `claude-3-opus`, `claude-3-sonnet` (legacy models)

**OpenAI models**:
- `gpt-4o` ✅
- `gpt-4o-mini` ✅
- NOT: `gpt-4`, `gpt-3.5-turbo` (use versioned names)

**Google models**:
- `gemini-2.0-flash-exp` ✅
- `gemini-1.5-pro` ✅
- `gemini-1.5-flash` ✅
- NOT: `gemini-pro` (use versioned names)

### High Costs

**Diagnosis**:

1. Enable logging:
   ```bash
   LOG_TOKEN_USAGE=true
   DEBUG_LLM_CALLS=true
   ```

2. Check token usage per operation in console output

3. Calculate expected cost:
   ```
   Categorization: ~500 input + ~150 output tokens
   Context Extraction: ~1500 input + ~400 output tokens
   Cold Detection: ~800 input + ~200 output tokens
   ```

**Optimization**:

1. **Use economy tier for categorization**:
   ```bash
   ECONOMY_LLM_MODEL=claude-haiku-4-5  # or gpt-4o-mini
   ```

2. **Enable aggressive caching**:
   ```bash
   CATEGORIZATION_CACHE_TTL=7200  # 2 hours
   ```

3. **Reduce context extraction usage**:
   - Only extract for WORK/PERSONAL emails
   - Skip context for newsletters/marketing

4. **Switch to cheaper provider for categorization**:
   ```bash
   ECONOMY_LLM_PROVIDER=google
   ECONOMY_LLM_MODEL=gemini-1.5-flash  # $0.075/$0.30 per 1M
   ```

### Slow Performance

**Diagnosis**:

1. Check network latency to LLM provider API
2. Verify batch size not too large (`MAX_BATCH_SIZE=50`)
3. Check cache hit rate in logs

**Optimization**:

1. **Enable caching** (faster for repeat categorization):
   ```bash
   CATEGORIZATION_CACHE_TTL=3600
   CACHE_COLD_SENDERS=true
   ```

2. **Use faster models**:
   - Anthropic: Haiku (fastest, cheapest)
   - OpenAI: GPT-4o-mini (fast, cheap)
   - Google: Gemini 2.0 Flash (very fast)

3. **Reduce batch size** if timeouts occur:
   ```bash
   MAX_BATCH_SIZE=25
   ```

### Cache Not Working

**Diagnosis**:

1. Check cache is enabled:
   ```bash
   CATEGORIZATION_CACHE_TTL=3600  # Should be > 0
   ```

2. Look for cache logs:
   ```
   💾 Cache HIT: categorize:18d4f1e2a3b4c5d6
   ```

**Fix**:

1. Verify `.env` settings
2. Restart MCP server after changing cache settings
3. Cache keys based on messageId (categorization) or sender email (cold detection)

---

## Cost Monitoring

### Daily Budget Calculation

**Formula**:
```
Daily Cost = (Emails/Day) × (Analysis Cost/Email)
```

**Example** (100 emails/day):
```
Categorization (Haiku):     100 × $0.0004  = $0.04
Context Extraction (20):     20 × $0.002   = $0.04
Cold Detection (100):       100 × $0.0005  = $0.05
-------------------------------------------
Total:                                       $0.13/day
Monthly:                                     ~$3.90
```

### Setting Alerts

**Anthropic**:
- Console → Settings → Usage alerts
- Set monthly budget limit

**OpenAI**:
- Platform → Settings → Billing → Usage limits
- Set hard limit + email alerts

**Google**:
- AI Studio → Quota
- Monitor via Cloud Console

---

## Next Steps

1. ✅ **Configuration Complete** → Test with real emails
2. 📊 **Monitor Costs** → Enable `LOG_TOKEN_USAGE=true`
3. 🎯 **Optimize** → Enable caching, use economy tier
4. 🚀 **Production** → Integrate with workspace skills (email-intelligence, inbox-automation)

---

**Support**:
- Issues: https://github.com/BNYEDAGAWD/unified-workspace/issues
- Docs: `/Development/unified-workspace/Gmail-MCP-Server/README.md`
- Workspace Guide: `/Development/unified-workspace/CLAUDE.md`
