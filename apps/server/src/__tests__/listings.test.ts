import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { createApp } from '../Ui/Http/routes.js';

// Test fixtures with static IDs
const TEST_PHONE = '351999888777';
const TEST_PROFILE_ID = 'aaaaaaaa-bbbb-cccc-dddd-111111111111';
const TEST_SESSION_TOKEN = 'test-session-token-for-listings-test';

let prisma: PrismaClient;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  prisma = new PrismaClient({ adapter });
  app = createApp(prisma);
  
  // Clean up any existing test data
  await prisma.stampListing.deleteMany({ where: { userId: TEST_PROFILE_ID } });
  await prisma.session.deleteMany({ where: { userId: TEST_PROFILE_ID } });
  await prisma.profile.deleteMany({ where: { id: TEST_PROFILE_ID } });
  
  // Create test profile
  await prisma.profile.create({
    data: {
      id: TEST_PROFILE_ID,
      phone: TEST_PHONE,
      displayName: 'Test User',
      registrationComplete: true,
      weeklyResetAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  
  // Create test session
  await prisma.session.create({
    data: {
      userId: TEST_PROFILE_ID,
      token: TEST_SESSION_TOKEN,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
});

afterAll(async () => {
  // Clean up test data
  await prisma.stampListing.deleteMany({ where: { userId: TEST_PROFILE_ID } });
  await prisma.session.deleteMany({ where: { userId: TEST_PROFILE_ID } });
  await prisma.profile.deleteMany({ where: { id: TEST_PROFILE_ID } });
  await prisma.$disconnect();
});

// Helper to make authenticated requests
async function makeRequest(method: string, path: string, body?: object, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const request = new Request(`http://localhost${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  return app.fetch(request);
}

// Type for listing response
interface ListingResponse {
  listing: {
    id: string;
    type: string;
    quantity: number;
    status: string;
    user: { id: string };
  };
}

interface ListingsResponse {
  listings: unknown[];
}

interface ErrorResponse {
  code: string;
}

// ---------------------------------------------------------------------------
// GET /api/listings - Get listings
// ---------------------------------------------------------------------------
describe('GET /api/listings', () => {
  test('returns empty array when no listings exist', async () => {
    const res = await makeRequest('GET', '/api/listings');
    expect(res.status).toBe(200);
    const data = (await res.json()) as ListingsResponse;
    expect(data.listings).toBeInstanceOf(Array);
  });
});

// ---------------------------------------------------------------------------
// POST /api/listings - Create listing
// ---------------------------------------------------------------------------
describe('POST /api/listings', () => {
  test('returns 401 without authentication', async () => {
    const res = await makeRequest('POST', '/api/listings', { type: 'offer', quantity: 5 });
    expect(res.status).toBe(401);
  });

  test('returns 400 with invalid request body', async () => {
    const res = await makeRequest('POST', '/api/listings', { type: 'invalid' }, TEST_SESSION_TOKEN);
    expect(res.status).toBe(400);
  });

  test('creates an offer listing with pending_send status', async () => {
    // Clean up before test
    await prisma.stampListing.deleteMany({ where: { userId: TEST_PROFILE_ID } });

    const res = await makeRequest('POST', '/api/listings', { type: 'offer', quantity: 5 }, TEST_SESSION_TOKEN);
    expect(res.status).toBe(201);

    const data = (await res.json()) as ListingResponse;
    expect(data.listing).toBeDefined();
    expect(data.listing.type).toBe('offer');
    expect(data.listing.quantity).toBe(5);
    expect(data.listing.status).toBe('pending_send');
    expect(data.listing.user).toBeDefined();
    expect(data.listing.user.id).toBe(TEST_PROFILE_ID);
  });

  test('creates a request listing with active status', async () => {
    // Clean up before test
    await prisma.stampListing.deleteMany({ where: { userId: TEST_PROFILE_ID } });

    const res = await makeRequest('POST', '/api/listings', { type: 'request', quantity: 3 }, TEST_SESSION_TOKEN);
    expect(res.status).toBe(201);

    const data = (await res.json()) as ListingResponse;
    expect(data.listing).toBeDefined();
    expect(data.listing.type).toBe('request');
    expect(data.listing.quantity).toBe(3);
    expect(data.listing.status).toBe('active');
  });

  test('returns 409 when user already has an active listing', async () => {
    // Clean up and create an active listing
    await prisma.stampListing.deleteMany({ where: { userId: TEST_PROFILE_ID } });
    await makeRequest('POST', '/api/listings', { type: 'request', quantity: 1 }, TEST_SESSION_TOKEN);

    // Try to create another listing
    const res = await makeRequest('POST', '/api/listings', { type: 'offer', quantity: 5 }, TEST_SESSION_TOKEN);
    expect(res.status).toBe(409);

    const data = (await res.json()) as ErrorResponse;
    expect(data.code).toBe('CONFLICTING_LISTING');
  });
});

// ---------------------------------------------------------------------------
// PUT /api/listings/:id/cancel - Cancel listing
// ---------------------------------------------------------------------------
describe('PUT /api/listings/:id/cancel', () => {
  test('cancels own listing successfully', async () => {
    // Clean up and create a listing to cancel
    await prisma.stampListing.deleteMany({ where: { userId: TEST_PROFILE_ID } });
    const createRes = await makeRequest('POST', '/api/listings', { type: 'offer', quantity: 5 }, TEST_SESSION_TOKEN);
    const createData = (await createRes.json()) as ListingResponse;

    const res = await makeRequest('PUT', `/api/listings/${createData.listing.id}/cancel`, {}, TEST_SESSION_TOKEN);
    expect(res.status).toBe(200);

    const data = (await res.json()) as ListingResponse;
    expect(data.listing.status).toBe('cancelled');
  });
});

