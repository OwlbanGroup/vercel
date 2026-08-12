import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ClaudeService, ClaudeModels } from './claude.service';
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

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

// DTO for the outgoing response body
class ClaudeResponseDto {
  @IsString()
  response!: string;
}

@Controller('claude') // This controller will handle requests under the '/claude' path
export class ClaudeController {
  constructor(private readonly claudeService: ClaudeService) {}

  @Post('prompt') // This endpoint will be accessible at POST /claude/prompt
  @HttpCode(200) // Explicitly set HTTP status code to 200 OK
  async getClaudeResponse(@Body() body: PromptDto): Promise<ClaudeResponseDto> {
    const { prompt, model } = body;
    console.log(`[ClaudeController] Received prompt for Claude: "${prompt}" (Model: ${model || 'default'})`);

    const claudeResponse = await this.claudeService.sendMessage(prompt, model);
    const textContent = claudeResponse.content[0]?.text;
    return { response: textContent || 'No text content found in Claude response.' };
  }
}