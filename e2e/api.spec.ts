import { test, expect } from '@playwright/test';

test.describe('GET /api/schema', () => {
  test('returns all 9 analytical views', async ({ request }) => {
    const res = await request.get('/api/schema');
    expect(res.status()).toBe(200);
    const schema = await res.json();
    const views = ['v_hospital_profile', 'v_hai_sir', 'v_mortality', 'v_hcahps_stars',
                   'v_mspb', 'v_hvbp_tps', 'v_hac', 'v_hrrp', 'v_state_summary'];
    for (const view of views) {
      expect(Object.keys(schema)).toContain(view);
    }
  });

  test('returns column info for a specific table', async ({ request }) => {
    const res = await request.get('/api/schema?table=v_hospital_profile');
    expect(res.status()).toBe(200);
    const cols: Array<{ column_name: string; data_type: string }> = await res.json();
    const colNames = cols.map((c) => c.column_name);
    expect(colNames).toContain('facility_id');
    expect(colNames).toContain('facility_name');
    expect(colNames).toContain('star_rating');
  });
});

test.describe('GET /api/hospitals', () => {
  test('search by name returns array', async ({ request }) => {
    const res = await request.get('/api/hospitals?name=mayo');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('facility_id');
    expect(data[0]).toHaveProperty('facility_name');
  });

  test('search by state returns hospitals in that state', async ({ request }) => {
    const res = await request.get('/api/hospitals?state=CA&limit=5');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.length).toBeGreaterThan(0);
    for (const hospital of data) {
      expect(hospital.state).toBe('CA');
    }
  });

  test('lookup by facility ID returns single hospital', async ({ request }) => {
    // First get a valid ID
    const listRes = await request.get('/api/hospitals?name=mayo');
    const list = await listRes.json();
    const id = list[0]?.facility_id;
    expect(id).toBeTruthy();

    const res = await request.get(`/api/hospitals?id=${id}`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    // Could be array or single object depending on implementation
    const hospital = Array.isArray(data) ? data[0] : data;
    expect(hospital?.facility_id).toBe(id);
  });

  test('unknown name returns empty array', async ({ request }) => {
    const res = await request.get('/api/hospitals?name=xyzthishospitaldoesnotexist99999');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });
});

test.describe('POST /api/query', () => {
  test('simple SELECT returns rows and count', async ({ request }) => {
    const res = await request.post('/api/query', {
      data: { sql: 'SELECT 1 AS n' },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('rows');
    expect(json).toHaveProperty('count');
    expect(json.rows[0].n).toBe(1);
  });

  test('query against v_hospital_profile returns hospitals', async ({ request }) => {
    const res = await request.post('/api/query', {
      data: {
        sql: `SELECT facility_id, facility_name, state, star_rating
              FROM v_hospital_profile
              WHERE star_rating IS NOT NULL
              ORDER BY star_rating DESC
              LIMIT 5`,
      },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.count).toBe(5);
    expect(json.rows[0]).toHaveProperty('facility_id');
    expect(json.rows[0].star_rating).toBeCloseTo(5, 0);
  });

  test('state summary aggregation works (COUNT returns number not BigInt)', async ({ request }) => {
    const res = await request.post('/api/query', {
      data: {
        sql: `SELECT state, COUNT(*) AS hospitals
              FROM v_hospital_profile
              GROUP BY state
              ORDER BY hospitals DESC
              LIMIT 3`,
      },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.rows[0].hospitals).toBeGreaterThan(0);
    // Must be a plain JS number, not a BigInt (which would fail JSON.stringify)
    expect(typeof json.rows[0].hospitals).toBe('number');
  });

  test('non-SELECT query is rejected with 403', async ({ request }) => {
    const res = await request.post('/api/query', {
      data: { sql: 'DROP TABLE hospitals' },
    });
    expect(res.status()).toBe(403);
  });

  test('missing sql returns 400', async ({ request }) => {
    const res = await request.post('/api/query', { data: {} });
    expect(res.status()).toBe(400);
  });

  test('HAI SIR view returns valid SIR values', async ({ request }) => {
    const res = await request.post('/api/query', {
      data: {
        sql: `SELECT facility_id, measure_id, sir_value
              FROM v_hai_sir
              WHERE sir_value IS NOT NULL
              LIMIT 10`,
      },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.count).toBeGreaterThan(0);
    expect(json.rows[0].sir_value).toBeDefined();
  });

  test('v_state_summary returns all 50+ state/territory rows', async ({ request }) => {
    const res = await request.post('/api/query', {
      data: { sql: 'SELECT COUNT(*) AS states FROM v_state_summary' },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.rows[0].states).toBeGreaterThanOrEqual(50);
  });
});
