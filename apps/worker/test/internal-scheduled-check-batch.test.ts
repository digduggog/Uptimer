import { describe, expect, it, vi } from 'vitest';

import type { Env } from '../src/env';
import worker from '../src/index';
import { createFakeD1Database } from './helpers/fake-d1';

describe('internal scheduled check-batch route', () => {
  it('rejects stale and future checked_at values even with a valid token', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-04-15T05:18:20.000Z').valueOf());

    const env = {
      DB: createFakeD1Database([]),
      ADMIN_TOKEN: 'test-admin-token',
    } as unknown as Env;

    const makeRequest = (checkedAt: number) =>
      worker.fetch(
        new Request('https://status.example.com/api/v1/internal/scheduled/check-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({
            token: 'test-admin-token',
            ids: [1],
            checked_at: checkedAt,
            state_failures_to_down_from_up: 2,
            state_successes_to_up_from_down: 2,
          }),
        }),
        env,
        { waitUntil: vi.fn() } as unknown as ExecutionContext,
      );

    await expect(makeRequest(1_776_230_340)).resolves.toMatchObject({ status: 403 });
    await expect(makeRequest(1_776_230_160)).resolves.toMatchObject({ status: 403 });
  });
});
