const ARROW_MIME = 'application/vnd.apache.arrow.stream';

export interface ArrowQueryResult {
  rows: Record<string, unknown>[];
  schema: { name: string; type: string }[];
}

/**
 * Fetch a SQL query result as Arrow IPC, decode it client-side,
 * and return rows + schema. Falls back to JSON if Arrow decode fails.
 *
 * `apache-arrow` is lazy-loaded to avoid bloating the initial bundle.
 */
export async function fetchArrowQuery(sql: string): Promise<ArrowQueryResult> {
  const res = await fetch('/api/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: ARROW_MIME,
    },
    body: JSON.stringify({ sql }),
  });

  if (!res.ok) {
    // Try to extract error message from JSON body
    const text = await res.text();
    let msg = `Query failed (${res.status})`;
    try {
      const json = JSON.parse(text);
      if (json.error) msg = json.error;
    } catch { /* response wasn't JSON */ }
    throw new Error(msg);
  }

  const contentType = res.headers.get('content-type') ?? '';

  if (contentType.includes(ARROW_MIME)) {
    // Lazy-load apache-arrow to keep it out of the initial bundle
    const { tableFromIPC } = await import('apache-arrow');
    const buffer = await res.arrayBuffer();
    const table = tableFromIPC(new Uint8Array(buffer));

    const schema = table.schema.fields.map((f) => ({
      name: f.name,
      type: String(f.type),
    }));

    const rows: Record<string, unknown>[] = [];
    for (let i = 0; i < table.numRows; i++) {
      const row: Record<string, unknown> = {};
      for (const field of table.schema.fields) {
        const vec = table.getChild(field.name);
        if (vec) {
          const val = vec.get(i);
          // Convert BigInt to Number for downstream consumers (charts, tables)
          row[field.name] = typeof val === 'bigint' ? Number(val) : val;
        }
      }
      rows.push(row);
    }

    return { rows, schema };
  }

  // JSON fallback (server didn't return Arrow)
  const json = await res.json();
  return {
    rows: Array.isArray(json) ? json : (json.rows ?? []),
    schema: [],
  };
}
