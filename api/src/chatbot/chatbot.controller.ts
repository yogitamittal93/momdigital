import { Controller, Get, Post, Body, Req, Headers, UseGuards } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotAuthGuard } from './chatbot-auth.guard';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  @UseGuards(ChatbotAuthGuard)
  async handleMessage(
    @Body() body: { message: string },
    @Req() req: { user?: { userId: string } },
    @Headers('x-test-user-id') testUserId?: string,
  ) {
    const userId = req.user?.userId || testUserId || null;

    if (!userId) {
      return { reply: 'Please log in to continue.', needsConfirmation: true };
    }

    console.log(`[ChatbotController] Processing message for userId: ${userId}`);
    return this.chatbotService.processUserMessage(userId, body.message);
  }

  /**
   * GET /chatbot/health
   * Public endpoint — no auth guard.
   * Proxies to the ML service /health so the frontend can show a status indicator.
   */
  @Get('health')
  async getMlHealth() {
    return this.chatbotService.checkMlHealth();
  }
}