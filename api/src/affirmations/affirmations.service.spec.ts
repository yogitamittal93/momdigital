import { AffirmationsService } from './affirmations.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

describe('AffirmationsService', () => {
  let service: AffirmationsService;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockHttpService: jest.Mocked<HttpService>;

  beforeEach(() => {
    mockConfigService = {
      getOrThrow: jest.fn().mockReturnValue('mock-api-key'),
    } as unknown as jest.Mocked<ConfigService>;

    mockHttpService = {
      post: jest.fn().mockReturnValue(
        of({
          data: {
            choices: [
              {
                message: {
                  content: 'Yogita, take a deep breath. You are doing great.',
                },
              },
            ],
          },
        }),
      ),
    } as unknown as jest.Mocked<HttpService>;

    service = new AffirmationsService(mockConfigService, mockHttpService);
  });

  describe('getDailyAffirmation', () => {
    it('should return a static daily affirmation', () => {
      const user = { name: 'Yogita Mittal', dueDate: new Date() };
      const result = service.getDailyAffirmation(user);
      expect(result).toBeDefined();
      expect(result.message).toBeDefined();
      expect(result.stage).toBeDefined();
    });
  });

  describe('generatePersonalised', () => {
    it('should call Groq and return generated affirmation', async () => {
      const user = { name: 'Yogita Mittal', dueDate: new Date() };
      const opts = { mood: 'anxious', intention: 'find peace' };
      const result = await service.generatePersonalised(user, opts);
      expect(result.message).toContain('Yogita');
      expect(result.generated).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockHttpService.post).toHaveBeenCalled();
    });
  });
});
