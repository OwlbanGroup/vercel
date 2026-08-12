import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
// Import the generate and streamText functions from the Vercel AI SDK
import { generate } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export enum ClaudeModels {
  CLAUDE_3_OPUS = 'claude-3-opus-20240229',
  CLAUDE_3_SONNET = 'claude-3-sonnet-20240229',
  CLAUDE_3_HAIKU = 'claude-3-haiku-20240307',
  // Add other Claude models as needed
}


@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    // The Vercel AI SDK will automatically pick up the ANTHROPIC_API_KEY
    // from environment variables. Ensure it's configured in your deployment
    // environment (e.g., Vercel project settings, .env file).
  }
  
  // Existing method for non-streaming response (can be kept or removed if only streaming is desired)
  async sendMessage(prompt: string, model?: string): Promise<{ response: string }> {
    const cacheKey = `claude-prompt:${model || 'default'}:${prompt}`;
    const cachedResponse = await this.cacheManager.get<{ response: string }>(cacheKey);

    if (cachedResponse) {
      this.logger.log(`[Cache HIT] Returning cached response for prompt: "${prompt}"`);
      return {
        ...cachedResponse,
        response: `(From Cache) ${cachedResponse.response}`,
      };
    }

    this.logger.log(`[Cache MISS] Sending message to Claude API. Prompt: "${prompt}", Model: ${model || 'default'}`);

    try {
      // SIMULATION: Trigger a failure for demonstration purposes if the prompt contains "fail".
      if (prompt.toLowerCase().includes('fail')) {
        throw new Error('Simulated API call failure: The API key is invalid or the service is down.');
      }

      // Use the Vercel AI SDK's generate function
      const { text: generatedText } = await generate({
        model: anthropic(model || ClaudeModels.CLAUDE_3_SONNET),
        prompt: prompt,
        // You can add other parameters like maxTokens, temperature, etc.
        // maxTokens: 1024,
        // temperature: 0.7,
      });
      
      const response = { response: generatedText };

      this.logger.log(`Caching API response for prompt: "${prompt}"`);
      await this.cacheManager.set(cacheKey, response);

      return response;
    } catch (error) {
      this.logger.error(`Failed to get response from Claude API: ${error.message}`, error.stack);
      // In a real-world scenario, you might inspect the 'error' object to see if it's a specific
      // error from the SDK (e.g., APIError, AuthenticationError) and handle it accordingly.
      // For this example, we'll re-throw a generic NestJS HTTP exception.
      throw new InternalServerErrorException('Failed to communicate with the Claude API.');
    }
  }

  // New method for streaming response
  async streamMessage(prompt: string, model?: string): Promise<AsyncIterable<string>> {
    this.logger.log(`[Streaming] Sending message to Claude API. Prompt: "${prompt}", Model: ${model || 'default'}`);

    try {
      // SIMULATION: Trigger a failure for demonstration purposes if the prompt contains "fail".
      if (prompt.toLowerCase().includes('fail')) {
        throw new Error('Simulated API call failure during streaming: The API key is invalid or the service is down.');
      }

      const result = await streamText({
        model: anthropic(model || ClaudeModels.CLAUDE_3_SONNET),
        prompt: prompt,
        // maxTokens: 1024,
        // temperature: 0.7,
      });

      return result.textStream;
    } catch (error) {
      this.logger.error(`Failed to stream response from Claude API: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to communicate with the Claude API for streaming.');
    }
  }
}