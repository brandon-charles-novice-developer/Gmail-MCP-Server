/**
 * LLM Configuration for Gmail Intelligence
 *
 * Supports multi-provider LLM routing with cost optimization
 * Providers: Anthropic Claude, OpenAI, Google Gemini
 */

export interface LLMConfig {
  provider: 'anthropic' | 'openai' | 'google';
  model: string;
  apiKey: string;
}

export interface ModelTier {
  default: LLMConfig;
  economy: LLMConfig;
  chat?: LLMConfig;
}

/**
 * Get LLM configuration from environment variables
 */
export function getLLMConfig(): ModelTier {
  const provider = (process.env.LLM_PROVIDER || 'anthropic') as 'anthropic' | 'openai' | 'google';
  const economyProvider = (process.env.ECONOMY_LLM_PROVIDER || provider) as 'anthropic' | 'openai' | 'google';

  // Default model (for context extraction, complex analysis)
  const defaultModel = process.env.LLM_MODEL || getDefaultModelForProvider(provider);
  const defaultApiKey = getApiKeyForProvider(provider);

  // Economy model (for categorization, simple classification)
  const economyModel = process.env.ECONOMY_LLM_MODEL || getEconomyModelForProvider(economyProvider);
  const economyApiKey = getApiKeyForProvider(economyProvider);

  return {
    default: {
      provider,
      model: defaultModel,
      apiKey: defaultApiKey,
    },
    economy: {
      provider: economyProvider,
      model: economyModel,
      apiKey: economyApiKey,
    },
  };
}

/**
 * Get default model for provider
 */
function getDefaultModelForProvider(provider: string): string {
  switch (provider) {
    case 'anthropic':
      return 'claude-sonnet-4-5-20250929';
    case 'openai':
      return 'gpt-4o';
    case 'google':
      return 'gemini-2.0-flash-exp';
    default:
      return 'claude-sonnet-4-5-20250929';
  }
}

/**
 * Get economy model for provider (cost-optimized)
 */
function getEconomyModelForProvider(provider: string): string {
  switch (provider) {
    case 'anthropic':
      return 'claude-haiku-4-5-20250929';
    case 'openai':
      return 'gpt-4o-mini';
    case 'google':
      return 'gemini-2.0-flash-exp';
    default:
      return 'claude-haiku-4-5-20250929';
  }
}

/**
 * Get API key for provider from environment
 */
function getApiKeyForProvider(provider: string): string {
  switch (provider) {
    case 'anthropic':
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      if (!anthropicKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required for Anthropic provider');
      }
      return anthropicKey;
    case 'openai':
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        throw new Error('OPENAI_API_KEY environment variable is required for OpenAI provider');
      }
      return openaiKey;
    case 'google':
      const googleKey = process.env.GOOGLE_AI_API_KEY;
      if (!googleKey) {
        throw new Error('GOOGLE_AI_API_KEY environment variable is required for Google provider');
      }
      return googleKey;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Model usage metadata for tracking
 */
export interface ModelUsage {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  timestamp: Date;
  operation: string;
}

/**
 * Simple in-memory token tracker
 */
class TokenTracker {
  private usage: ModelUsage[] = [];

  track(usage: ModelUsage) {
    this.usage.push(usage);
    // Keep only last 1000 operations
    if (this.usage.length > 1000) {
      this.usage = this.usage.slice(-1000);
    }
  }

  getUsage(since?: Date): ModelUsage[] {
    if (!since) return this.usage;
    return this.usage.filter(u => u.timestamp >= since);
  }

  getTotalTokens(since?: Date): { input: number; output: number } {
    const filtered = this.getUsage(since);
    return filtered.reduce(
      (acc, u) => ({
        input: acc.input + u.inputTokens,
        output: acc.output + u.outputTokens,
      }),
      { input: 0, output: 0 }
    );
  }
}

export const tokenTracker = new TokenTracker();
