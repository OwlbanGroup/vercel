import { Controller, Post, Body, HttpCode, Sse, MessageEvent, UseGuards } from '@nestjs/common';
import { ClaudeService, ClaudeModels } from './claude.service'; // Removed ClaudeApiResponse import
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { JwtAuthGuard } from './auth/jwt-auth.guard'; // For authentication
import { Roles } from './auth/roles.decorator'; // For defining required roles
import { RolesGuard } from './auth/roles.guard'; // For enforcing roles

// DTO for the incoming request body
class PromptDto {
  @IsString()
  @IsNotEmpty()
  prompt!: string;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(ClaudeModels))
  model?: string;
}

@Controller('claude') // This controller will handle requests under the '/claude' path
@UseGuards(JwtAuthGuard, RolesGuard) // Apply both JWT auth and Roles guard to all routes in this controller
export class ClaudeController {
  constructor(private readonly claudeService: ClaudeService) {}

  @Post('prompt') // This endpoint will be accessible at POST /claude/prompt
  @HttpCode(200) // Explicitly set HTTP status code to 200 OK
  async getClaudeResponse(@Body() body: PromptDto): Promise<ClaudeResponseDto> {
    // DTO for the outgoing response body (kept for this specific endpoint)
    class ClaudeResponseDto {
      @IsString()
      response!: string;
    }

    const { prompt, model } = body;
    console.log(`[ClaudeController] Received prompt for Claude: "${prompt}" (Model: ${model || 'default'})`);

    const claudeResponse = await this.claudeService.sendMessage(prompt, model); // Now returns { response: string }
    return { response: claudeResponse.response || 'No text content found in Claude response.' };
  }

  @Roles('admin') // Only users with the 'admin' role can access this streaming endpoint
  @Sse('stream-prompt') // This endpoint will be accessible at GET/POST /claude/stream-prompt for Server-Sent Events
  async streamClaudeResponse(@Body() body: PromptDto): Promise<AsyncIterable<MessageEvent>> {
    const { prompt, model } = body;
    console.log(`[ClaudeController] Received streaming prompt for Claude: "${prompt}" (Model: ${model || 'default'})`);

    const textStream = await this.claudeService.streamMessage(prompt, model);

    return (async function* () {
      for await (const chunk of textStream) {
        yield { data: chunk }; // Wrap each chunk in a MessageEvent for SSE
      }
    })();
  }
}