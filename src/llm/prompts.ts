/**
 * LLM Prompts for Email Intelligence
 *
 * Ported from inbox-zero with adaptations for MCP usage
 */

/**
 * Email categorization prompt
 * Source: inbox-zero /utils/ai/categorize-sender/
 */
export function getCategorizationPrompt(params: {
  from: string;
  subject: string;
  snippet: string;
  customCategories?: string[];
}): { system: string; prompt: string } {
  const categories = params.customCategories?.length
    ? params.customCategories.join(', ')
    : 'NEWSLETTER, MARKETING, CALENDAR, RECEIPT, NOTIFICATION, PERSONAL, WORK, COLD_EMAIL';

  return {
    system: `You are an expert email categorization system. Analyze emails and categorize them accurately.

Categories:
- NEWSLETTER: Regular newsletters, digests, blog updates
- MARKETING: Promotional emails, sales, special offers
- CALENDAR: Meeting invites, event notifications, calendar updates
- RECEIPT: Purchase confirmations, invoices, payment receipts
- NOTIFICATION: System notifications, alerts, status updates
- PERSONAL: Personal correspondence from known contacts
- WORK: Work-related emails from colleagues or clients
- COLD_EMAIL: Unsolicited sales, recruitment, partnership requests

Categorization Guidelines:
- Use specific indicators in subject, sender domain, and content
- Newsletters typically have "unsubscribe" links and regular sending patterns
- Marketing emails emphasize offers, discounts, limited-time deals
- Receipts contain order numbers, amounts, transaction IDs
- Cold emails often request meetings, demos, or introduce unknown services
- Be precise - avoid PERSONAL category unless clearly from a known contact

Available categories: ${categories}`,

    prompt: `Categorize this email:

From: ${params.from}
Subject: ${params.subject}
Snippet: ${params.snippet}

Provide the category, confidence score (0.0-1.0), reasoning, and suggested Gmail labels.`,
  };
}

/**
 * Cold email detection prompt
 * Source: inbox-zero /utils/cold-email/prompt.ts
 */
export function getColdEmailPrompt(params: {
  from: string;
  subject: string;
  body: string;
  userProfile?: { company?: string; role?: string; interests?: string[] };
}): { system: string; prompt: string } {
  const profileContext = params.userProfile
    ? `
User Context:
- Company: ${params.userProfile.company || 'Unknown'}
- Role: ${params.userProfile.role || 'Unknown'}
- Interests: ${params.userProfile.interests?.join(', ') || 'Not specified'}
`
    : '';

  return {
    system: `You are an expert at detecting cold emails (unsolicited outreach).

Examples of COLD EMAILS:
- Sales pitches for products/services the recipient didn't request
- Recruitment emails from unknown recruiters
- Partnership requests from companies without prior relationship
- Marketing agencies offering services (SEO, web design, etc.)
- Investors or VCs reaching out cold
- Conference or event promotions

Examples of LEGITIMATE EMAILS:
- Emails from known contacts or colleagues
- Replies to previous conversations
- Newsletters the user subscribed to
- Transactional emails (receipts, password resets, notifications)
- Emails from clients or customers
- Community or forum notifications

Key Indicators of Cold Emails:
- No prior relationship or context
- Generic greetings ("I hope this email finds you well")
- Emphasis on scheduling calls or demos
- Mentions of "quick chat" or "picking your brain"
- Sender researched you on LinkedIn or your website
- Offers solutions to problems you didn't mention

Be conservative - only mark as cold email if clearly unsolicited outreach.`,

    prompt: `Analyze if this is a cold email:
${profileContext}
From: ${params.from}
Subject: ${params.subject}

Email Body:
${params.body}

Determine if this is a cold email, classify the type (SALES, RECRUITMENT, PARTNERSHIP, LEGITIMATE, UNKNOWN), provide confidence score, reasoning, and suggested action.`,
  };
}

/**
 * Email context extraction prompt
 * Source: inbox-zero /utils/ai/knowledge/extract-from-email-history.ts
 */
export function getContextExtractionPrompt(params: {
  from: string;
  subject: string;
  body: string;
  threadHistory?: Array<{ from: string; subject: string; body: string }>;
}): { system: string; prompt: string } {
  const threadContext = params.threadHistory?.length
    ? `
Thread History (${params.threadHistory.length} previous messages):
${params.threadHistory
  .map(
    (msg, i) => `
[Message ${i + 1}]
From: ${msg.from}
Subject: ${msg.subject}
Body: ${msg.body.substring(0, 500)}${msg.body.length > 500 ? '...' : ''}
`
  )
  .join('\n')}
`
    : '';

  return {
    system: `You are an expert at extracting key information from emails for AI agent context.

Your goal is to provide actionable context that helps AI agents understand:
- What is the main purpose of this email?
- What are the key points or decisions discussed?
- What action items or commitments were made?
- Who are the relevant people and their roles?
- What are important dates or deadlines?

Extraction Guidelines:
- Be concise but comprehensive (max 500 characters for summary)
- Extract specific action items, not general statements
- Include people with their context (role, relationship)
- Date extraction should include the context (e.g., "meeting on Jan 15" not just "Jan 15")
- Focus on information useful for decision-making
- Skip pleasantries and focus on substance
- Use bullet points for key points (no bullet characters, just newlines)`,

    prompt: `Extract key context from this email thread for AI agent usage:
${threadContext}

Current Email:
From: ${params.from}
Subject: ${params.subject}
Body: ${params.body}

Provide: summary (1-2 sentences), keyPoints (array), actionItems (array), people (array with name/email/role), dates (array with date/context), and relevantContext (combined text optimized for agent consumption).`,
  };
}

/**
 * Batch email analysis prompt
 */
export function getBatchAnalysisPrompt(params: {
  emails: Array<{
    messageId: string;
    from: string;
    subject: string;
    snippet: string;
  }>;
  analysisTypes: Array<'categorize' | 'context' | 'cold_detection'>;
}): { system: string; prompt: string } {
  const analysisTypesStr = params.analysisTypes.join(', ');

  return {
    system: `You are analyzing multiple emails in batch for efficiency.

Analysis Types Requested: ${analysisTypesStr}

For each email, provide the requested analysis:
- categorize: Category, confidence, reasoning, suggested labels
- context: Summary, key points, action items, people, dates
- cold_detection: Is cold email, type, confidence, reasoning, suggested action

Be consistent and efficient in your analysis.`,

    prompt: `Analyze these ${params.emails.length} emails:

${params.emails
  .map(
    (email, i) => `
Email ${i + 1} (ID: ${email.messageId}):
From: ${email.from}
Subject: ${email.subject}
Snippet: ${email.snippet}
`
  )
  .join('\n')}

Provide analysis for each email based on requested types: ${analysisTypesStr}

Also generate an overall summary and recommended actions across all emails.`,
  };
}

/**
 * Helper: Format email for LLM consumption
 */
export function formatEmailForLLM(params: {
  from?: string;
  to?: string;
  subject?: string;
  date?: string;
  body?: string;
}): string {
  const parts = [];

  if (params.from) parts.push(`From: ${params.from}`);
  if (params.to) parts.push(`To: ${params.to}`);
  if (params.subject) parts.push(`Subject: ${params.subject}`);
  if (params.date) parts.push(`Date: ${params.date}`);
  if (params.body) {
    parts.push('');
    parts.push(params.body);
  }

  return parts.join('\n');
}

/**
 * Helper: Get current date for LLM context
 */
export function getTodayForLLM(): string {
  return new Date().toISOString().split('T')[0];
}
