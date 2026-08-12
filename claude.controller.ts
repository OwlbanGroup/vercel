import { Controller, Post, Body, HttpCode, BadRequestException } from '@nestjs/common';
import { ClaudeService } from './claude.service';
import { IsString, IsNotEmpty } from 'class-validator';

// DTO for the incoming request body
class PromptDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;
}

@Controller('claude') // This controller will handle requests under the '/claude' path
export class ClaudeController {
  constructor(private readonly claudeService: ClaudeService) {}

  @Post('prompt') // This endpoint will be accessible at POST /claude/prompt
  @HttpCode(200) // Explicitly set HTTP status code to 200 OK
  async getClaudeResponse(@Body() body: PromptDto): Promise<any> {
    const { prompt } = body;
    console.log(`[ClaudeController] Received prompt for Claude: "${prompt}"`);

    const claudeResponse = await this.claudeService.sendMessage(prompt);
    // Assuming the Claude API response has a 'content' array with a 'text' property
    return { response: claudeResponse.content[0]?.text || 'No text content found in Claude response.' };
  }
}