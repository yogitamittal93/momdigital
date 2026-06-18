import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Response } from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from 'prisma/prisma.service';

describe('Nanny/Caregiver Trust Streak E2E Tests', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let testUser: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prisma = app.get(PrismaService);

    // Create a temporary test user
    testUser = await prisma.user.create({
      data: {
        email: `testnanny-${Date.now()}@example.com`,
        name: 'Test Nanny Parent',
        role: 'MOTHER',
      },
    });
  });

  afterAll(async () => {
    // Cleanup caregivers and test checks
    await prisma.trustedHelperCheck.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.caregiver.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    await app.close();
  });

  it('should auto-create a default caregiver when checking streak first time', async () => {
    const res: Response = await request(app.getHttpServer())
      .get('/api/nanny/caregiver?helperType=nanny')
      .set('x-test-user-id', testUser.id);

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Default Nanny');
    expect(res.body[0].consecutiveCheckedInDays).toBe(0);
    expect(res.body[0].status).toBe('Verifying');
  });

  it('should create and assign a new caregiver', async () => {
    const res: Response = await request(app.getHttpServer())
      .post('/api/nanny/caregiver')
      .set('x-test-user-id', testUser.id)
      .send({ name: 'Sita', helperType: 'nanny' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Sita');
    expect(res.body.isAssigned).toBe(true);

    // Verify list endpoint orders assigned first
    const listRes: Response = await request(app.getHttpServer())
      .get('/api/nanny/caregiver?helperType=nanny')
      .set('x-test-user-id', testUser.id);

    expect(listRes.status).toBe(200);
    expect(listRes.body[0].name).toBe('Sita');
    expect(listRes.body[0].isAssigned).toBe(true);
    expect(listRes.body[1].name).toBe('Default Nanny');
    expect(listRes.body[1].isAssigned).toBe(false);
  });

  it('should increment streak on first daily check-in', async () => {
    const checkRes: Response = await request(app.getHttpServer())
      .post('/api/nanny/check')
      .set('x-test-user-id', testUser.id)
      .send({
        helperType: 'nanny',
        checks: { handwashing: true, hygiene: true },
        score: 100,
        notes: 'Great job today',
      });

    expect(checkRes.status).toBe(201);

    const listRes: Response = await request(app.getHttpServer())
      .get('/api/nanny/caregiver?helperType=nanny')
      .set('x-test-user-id', testUser.id);

    const assigned = listRes.body.find((c: any) => c.isAssigned);
    expect(assigned.consecutiveCheckedInDays).toBe(1);
  });

  it('should reset streak when manually triggered', async () => {
    const listRes1: Response = await request(app.getHttpServer())
      .get('/api/nanny/caregiver?helperType=nanny')
      .set('x-test-user-id', testUser.id);

    const activeNanny = listRes1.body.find((c: any) => c.isAssigned);

    const resetRes: Response = await request(app.getHttpServer())
      .post(`/api/nanny/caregiver/${activeNanny.id}/reset`)
      .set('x-test-user-id', testUser.id);

    expect(resetRes.status).toBe(201);
    expect(resetRes.body.consecutiveCheckedInDays).toBe(0);
    expect(resetRes.body.status).toBe('Verifying');
  });
});
