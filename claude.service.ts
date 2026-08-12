import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
// import Anthropic from '@anthropic-ai/sdk';

export enum ClaudeModels {
  CLAUDE_3_OPUS = 'claude-3-opus-20240229',
  CLAUDE_3_SONNET = 'claude-3-sonnet-20240229',
  CLAUDE_3_HAIKU = 'claude-3-haiku-20240307',
  // Add other Claude models as needed
}

// Define interfaces for the Claude API response structure
interface ClaudeMessageContent {
  type: 'text';
  text: string;
}

export interface ClaudeApiResponse {
  content: ClaudeMessageContent[];
  // ... other potential properties like id, model, role, stop_reason, etc.
}

@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);
  // private readonly anthropic: Anthropic;

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    // In a real application, you would initialize the SDK client here.
    // The validation schema in AppModule ensures the API key is present.
    // const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    // if (!apiKey) {
    //   // This check is technically redundant due to the validation schema
    //   throw new Error('ANTHROPIC_API_KEY is not configured.');
    // }
    // this.anthropic = new Anthropic({ apiKey });
  }

  async sendMessage(prompt: string, model?: string): Promise<ClaudeApiResponse> {
    const cacheKey = `claude-prompt:${model || 'default'}:${prompt}`;
    const cachedResponse = await this.cacheManager.get<ClaudeApiResponse>(cacheKey);

    if (cachedResponse) {
      this.logger.log(`[Cache HIT] Returning cached response for prompt: "${prompt}"`);
      // For demonstration, we'll modify the response to indicate it's from the cache.
      const cachedText = cachedResponse.content[0]?.text || '';
      return {
        ...cachedResponse,
        content: [
          { type: 'text', text: `(From Cache) ${cachedText}` },
        ],
      };
    }

    this.logger.log(`[Cache MISS] Sending message to Claude API. Prompt: "${prompt}", Model: ${model || 'default'}`);

    try {
      // In a real application, you would integrate with the Claude API here.
      // For demonstration, we'll simulate an API call that can fail.

      // SIMULATION: Trigger a failure for demonstration purposes if the prompt contains "fail".
      if (prompt.toLowerCase().includes('fail')) {
        throw new Error('Simulated API call failure: The API key is invalid or the service is down.');
      }

      // Example of integrating with an actual Claude API client (e.g., from Anthropic)
      // const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      // const response = await anthropic.messages.create({
      //   model: model || ClaudeModels.CLAUDE_3_SONNET,
      //   max_tokens: 1024,
      //   messages: [{ role: 'user', content: prompt }],
      // });
      // const apiResponse = response;

      // Mock API response for success case
      const apiResponse: ClaudeApiResponse = {
        content: [{ type: 'text', text: `This is a mock response from Claude for your prompt: "${prompt}" using model: ${model || 'default'}.` }],
      };

      this.logger.log(`Caching API response for prompt: "${prompt}"`);
      await this.cacheManager.set(cacheKey, apiResponse);

      return apiResponse;
    } catch (error) {
      this.logger.error(`Failed to get response from Claude API: ${error.message}`, error.stack);
      // In a real-world scenario, you might inspect the 'error' object to see if it's a specific
      // error from the SDK (e.g., APIError, AuthenticationError) and handle it accordingly.
      // For this example, we'll re-throw a generic NestJS HTTP exception.
      throw new InternalServerErrorException('Failed to communicate with the Claude API.');
    }
  }
}