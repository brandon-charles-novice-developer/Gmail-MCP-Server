/**
 * AI-Powered Email Analysis Tools
 *
 * Implements 4 new MCP tools for intelligent email analysis:
 * 1. categorize_email - AI categorization of emails
 * 2. extract_email_context - Extract key information for agent context
 * 3. detect_cold_email - Identify unsolicited outreach
 * 4. batch_analyze_emails - Batch analysis for efficiency
 */

import { z } from 'zod';
import { generateStructuredOutput } from './llm/provider.js';
import {
  getCategorizationPrompt,
  getColdEmailPrompt,
  getContextExtractionPrompt,
  getBatchAnalysisPrompt,
} from './llm/prompts.js';
import { llmCache } from './llm/provider.js';

// ============================================================================
// Schemas
// ============================================================================

export const CategorizeEmailSchema = z.object({
  messageId: z.string().describe('Gmail message ID to categorize'),
  categories: z
    .array(z.string())
    .optional()
    .describe('Optional custom categories (defaults to standard categories)'),
});

export const ExtractEmailContextSchema = z.object({
  messageId: z.string().describe('Gmail message ID to extract context from'),
  threadId: z.string().optional().describe('Include full thread context if provided'),
  maxHistoryMessages: z
    .number()
    .optional()
    .default(10)
    .describe('Maximum number of thread messages to include (default: 10)'),
});

export const DetectColdEmailSchema = z.object({
  messageId: z.string().describe('Gmail message ID to analyze'),
  userProfile: z
    .object({
      company: z.string().optional(),
      role: z.string().optional(),
      interests: z.array(z.string()).optional(),
    })
    .optional()
    .describe('Optional user context for better detection'),
});

export const BatchAnalyzeEmailsSchema = z.object({
  messageIds: z
    .array(z.string())
    .max(50)
    .describe('Array of Gmail message IDs to analyze (max 50)'),
  analysisTypes: z
    .array(z.enum(['categorize', 'context', 'cold_detection']))
    .describe('Types of analysis to perform'),
  options: z
    .object({
      autoApplyLabels: z.boolean().optional().default(false),
      generateSummary: z.boolean().optional().default(true),
    })
    .optional(),
});

// ============================================================================
// Output Schemas for Structured LLM Responses
// ============================================================================

const CategorizationResultSchema = z.object({
  category: z.enum([
    'NEWSLETTER',
    'MARKETING',
    'CALENDAR',
    'RECEIPT',
    'NOTIFICATION',
    'PERSONAL',
    'WORK',
    'COLD_EMAIL',
  ]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  suggestedLabels: z.array(z.string()).optional(),
});

const ColdEmailResultSchema = z.object({
  isColdEmail: z.boolean(),
  coldEmailType: z.enum(['SALES', 'RECRUITMENT', 'PARTNERSHIP', 'LEGITIMATE', 'UNKNOWN']),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  suggestedAction: z.enum(['ARCHIVE', 'LABEL_COLD', 'ALLOW', 'REVIEW']),
});

const ContextExtractionResultSchema = z.object({
  summary: z.string().max(500),
  keyPoints: z.array(z.string()),
  actionItems: z.array(z.string()),
  people: z.array(
    z.object({
      name: z.string(),
      email: z.string(),
      role: z.string().optional(),
    })
  ),
  dates: z.array(
    z.object({
      date: z.string(),
      context: z.string(),
    })
  ),
  relevantContext: z.string(),
  confidence: z.number().min(0).max(1),
});

// ============================================================================
// Tool Implementations
// ============================================================================

/**
 * Categorize Email Tool
 */
export async function categorizeEmail(
  params: z.infer<typeof CategorizeEmailSchema>,
  getEmailData: (messageId: string) => Promise<{
    from: string;
    subject: string;
    snippet: string;
  }>
): Promise<z.infer<typeof CategorizationResultSchema>> {
  // Check cache first
  const cacheKey = `categorize:${params.messageId}`;
  const cached = llmCache.get(cacheKey);
  if (cached) return cached;

  // Get email data
  const emailData = await getEmailData(params.messageId);

  // Generate categorization prompt
  const { system, prompt } = getCategorizationPrompt({
    from: emailData.from,
    subject: emailData.subject,
    snippet: emailData.snippet,
    customCategories: params.categories,
  });

  // Call LLM with economy model (categorization is simple classification)
  const result = await generateStructuredOutput({
    prompt,
    system,
    schema: CategorizationResultSchema,
    tier: 'economy',
    operation: 'categorize_email',
  });

  // Cache result
  llmCache.set(cacheKey, result);

  return result;
}

/**
 * Extract Email Context Tool
 */
export async function extractEmailContext(
  params: z.infer<typeof ExtractEmailContextSchema>,
  getEmailData: (messageId: string) => Promise<{
    from: string;
    subject: string;
    body: string;
  }>,
  getThreadData?: (threadId: string, maxMessages: number) => Promise<
    Array<{
      from: string;
      subject: string;
      body: string;
    }>
  >
): Promise<z.infer<typeof ContextExtractionResultSchema>> {
  // Get email data
  const emailData = await getEmailData(params.messageId);

  // Get thread history if threadId provided
  let threadHistory: Array<{ from: string; subject: string; body: string }> | undefined;
  if (params.threadId && getThreadData) {
    threadHistory = await getThreadData(params.threadId, params.maxHistoryMessages || 10);
  }

  // Generate context extraction prompt
  const { system, prompt } = getContextExtractionPrompt({
    from: emailData.from,
    subject: emailData.subject,
    body: emailData.body,
    threadHistory,
  });

  // Call LLM with default model (context extraction requires nuanced understanding)
  const result = await generateStructuredOutput({
    prompt,
    system,
    schema: ContextExtractionResultSchema,
    tier: 'default',
    operation: 'extract_context',
  });

  return result;
}

/**
 * Detect Cold Email Tool
 */
export async function detectColdEmail(
  params: z.infer<typeof DetectColdEmailSchema>,
  getEmailData: (messageId: string) => Promise<{
    from: string;
    subject: string;
    body: string;
  }>
): Promise<z.infer<typeof ColdEmailResultSchema>> {
  // Check cache first (by sender)
  const emailData = await getEmailData(params.messageId);
  const cacheKey = `cold:${emailData.from}`;
  const cached = llmCache.get(cacheKey);
  if (cached) return cached;

  // Generate cold email detection prompt
  const { system, prompt } = getColdEmailPrompt({
    from: emailData.from,
    subject: emailData.subject,
    body: emailData.body,
    userProfile: params.userProfile,
  });

  // Call LLM with economy model (cold email detection is pattern matching)
  const result = await generateStructuredOutput({
    prompt,
    system,
    schema: ColdEmailResultSchema,
    tier: 'economy',
    operation: 'detect_cold_email',
  });

  // Cache result by sender
  llmCache.set(cacheKey, result);

  return result;
}

/**
 * Batch Analyze Emails Tool
 */
export async function batchAnalyzeEmails(
  params: z.infer<typeof BatchAnalyzeEmailsSchema>,
  getEmailData: (messageId: string) => Promise<{
    from: string;
    subject: string;
    snippet: string;
    body?: string;
  }>
): Promise<{
  results: Array<{
    messageId: string;
    category?: z.infer<typeof CategorizationResultSchema>;
    context?: z.infer<typeof ContextExtractionResultSchema>;
    coldDetection?: z.infer<typeof ColdEmailResultSchema>;
  }>;
  summary: string;
  recommendedActions: Array<{
    messageId: string;
    action: string;
    reasoning: string;
  }>;
}> {
  const results: Array<{
    messageId: string;
    category?: z.infer<typeof CategorizationResultSchema>;
    context?: z.infer<typeof ContextExtractionResultSchema>;
    coldDetection?: z.infer<typeof ColdEmailResultSchema>;
  }> = [];

  // Process each email
  for (const messageId of params.messageIds) {
    const result: any = { messageId };

    try {
      const emailData = await getEmailData(messageId);

      // Categorization
      if (params.analysisTypes.includes('categorize')) {
        result.category = await categorizeEmail(
          { messageId, categories: undefined },
          async () => emailData
        );
      }

      // Context extraction (requires full body)
      if (params.analysisTypes.includes('context') && emailData.body) {
        result.context = await extractEmailContext(
          { messageId, maxHistoryMessages: 10 },
          async () => ({
            from: emailData.from,
            subject: emailData.subject,
            body: emailData.body!,
          })
        );
      }

      // Cold email detection (requires full body)
      if (params.analysisTypes.includes('cold_detection') && emailData.body) {
        result.coldDetection = await detectColdEmail(
          { messageId },
          async () => ({
            from: emailData.from,
            subject: emailData.subject,
            body: emailData.body!,
          })
        );
      }

      results.push(result);
    } catch (error) {
      console.error(`Error analyzing email ${messageId}:`, error);
      // Continue with other emails
    }
  }

  // Generate overall summary and recommendations
  let summary = '';
  const recommendedActions: Array<{ messageId: string; action: string; reasoning: string }> = [];

  if (params.options?.generateSummary) {
    // Create simple summary
    const categoryCount: Record<string, number> = {};
    const coldEmailCount = results.filter((r) => r.coldDetection?.isColdEmail).length;

    results.forEach((r) => {
      if (r.category) {
        categoryCount[r.category.category] = (categoryCount[r.category.category] || 0) + 1;
      }
    });

    summary = `Analyzed ${results.length} emails:\n`;
    Object.entries(categoryCount).forEach(([cat, count]) => {
      summary += `- ${cat}: ${count}\n`;
    });
    if (coldEmailCount > 0) {
      summary += `\n${coldEmailCount} cold emails detected`;
    }

    // Generate recommendations
    results.forEach((r) => {
      if (r.coldDetection?.isColdEmail && r.coldDetection.suggestedAction !== 'ALLOW') {
        recommendedActions.push({
          messageId: r.messageId,
          action: r.coldDetection.suggestedAction,
          reasoning: `Cold ${r.coldDetection.coldEmailType} email: ${r.coldDetection.reasoning}`,
        });
      }
    });
  }

  return {
    results,
    summary,
    recommendedActions,
  };
}
