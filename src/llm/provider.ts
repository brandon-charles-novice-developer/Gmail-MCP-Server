/**
 * LLM Provider - Multi-provider LLM client with structured output
 *
 * Supports Anthropic Claude, OpenAI, and Google Gemini
 * Uses Vercel AI SDK for unified interface
 */

import Anthropic from '@anthropic-ai/sdk';
import { generateObject, generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { getLLMConfig, tokenTracker, type LLMConfig, type ModelUsage } from './config.js';

/**
 * Generate structured output from LLM using Zod schema
 */
export async function generateStructuredOutput<T extends z.ZodType>(params: {
  prompt: string;
  schema: T;
  system?: string;
  tier?: 'default' | 'economy';
  operation?: string;
}): Promise<z.infer<T>> {
  const config = getLLMConfig();
  const llmConfig = params.tier === 'economy' ? config.economy : config.default;

  try {
    const provider = getProvider(llmConfig);
    const modelId = `${llmConfig.provider}:${llmConfig.model}`;

    const result = await generateObject({
      model: provider(llmConfig.model),
      schema: params.schema,
      prompt: params.prompt,
      system: params.system,
    });

    // Track token usage
    if (result.usage) {
      const usage: ModelUsage = {
        provider: llmConfig.provider,
        model: llmConfig.model,
        inputTokens: result.usage.promptTokens,
        outputTokens: result.usage.completionTokens,
        timestamp: new Date(),
        operation: params.operation || 'structured_output',
      };
      tokenTracker.track(usage);
    }

    return result.object;
  } catch (error) {
    console.error('Error generating structured output:', error);
    throw error;
  }
}

/**
 * Generate text output from LLM
 */
export async function generateTextOutput(params: {
  prompt: string;
  system?: string;
  tier?: 'default' | 'economy';
  operation?: string;
  maxTokens?: number;
}): Promise<string> {
  const config = getLLMConfig();
  const llmConfig = params.tier === 'economy' ? config.economy : config.default;

  try {
    const provider = getProvider(llmConfig);

    const result = await generateText({
      model: provider(llmConfig.model),
      prompt: params.prompt,
      system: params.system,
      maxTokens: params.maxTokens,
    });

    // Track token usage
    if (result.usage) {
      const usage: ModelUsage = {
        provider: llmConfig.provider,
        model: llmConfig.model,
        inputTokens: result.usage.promptTokens,
        outputTokens: result.usage.completionTokens,
        timestamp: new Date(),
        operation: params.operation || 'text_output',
      };
      tokenTracker.track(usage);
    }

    return result.text;
  } catch (error) {
    console.error('Error generating text output:', error);
    throw error;
  }
}

/**
 * Get provider SDK instance based on configuration
 */
function getProvider(config: LLMConfig) {
  switch (config.provider) {
    case 'anthropic':
      return createAnthropic({
        apiKey: config.apiKey,
      });
    case 'openai':
      return createOpenAI({
        apiKey: config.apiKey,
      });
    case 'google':
      return createGoogleGenerativeAI({
        apiKey: config.apiKey,
      });
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

/**
 * Batch process items with LLM (for efficiency)
 */
export async function batchProcess<TInput, TOutput extends z.ZodType>(params: {
  items: TInput[];
  schema: TOutput;
  promptBuilder: (items: TInput[]) => { prompt: string; system?: string };
  tier?: 'default' | 'economy';
  operation?: string;
  batchSize?: number;
}): Promise<z.infer<TOutput>[]> {
  const batchSize = params.batchSize || 10;
  const results: z.infer<TOutput>[] = [];

  // Process in batches
  for (let i = 0; i < params.items.length; i += batchSize) {
    const batch = params.items.slice(i, i + batchSize);
    const { prompt, system } = params.promptBuilder(batch);

    const result = await generateStructuredOutput({
      prompt,
      system,
      schema: params.schema,
      tier: params.tier,
      operation: params.operation,
    });

    results.push(result);
  }

  return results;
}

/**
 * Simple caching layer for repeated analyses
 */
class LLMCache {
  private cache = new Map<string, { data: any; timestamp: Date }>();
  private ttl = 60 * 60 * 1000; // 1 hour TTL

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: new Date() });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp.getTime() > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
  }
}

export const llmCache = new LLMCache();
