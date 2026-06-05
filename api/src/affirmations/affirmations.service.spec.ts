import { AffirmationsService } from './affirmations.service';

describe('AffirmationsService.generateCustomAffirmation', () => {
  it('returns a supportive custom affirmation for the user prompt', () => {
    const service = new AffirmationsService();

    const result = service.generateCustomAffirmation('I feel overwhelmed and tired');

    expect(result).toEqual(
      expect.objectContaining({
        message: expect.stringContaining('overwhelmed'),
        title: 'Personalized Affirmation',
      }),
    );
    expect(result.message.length).toBeGreaterThan(0);
  });
});
