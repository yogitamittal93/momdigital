import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  it('swallows persistence errors so callers can continue', async () => {
    const prisma = {
      analyticsEvent: {
        create: jest.fn().mockRejectedValue(new Error('db down')),
      },
    };

    const service = new AnalyticsService(prisma as any);

    await expect(
      service.trackEvent('chat_message_sent', 'user-1', { source: 'chat' }),
    ).resolves.toBeUndefined();
  });
});
