import { query } from './instance';

interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
}

let cachedSchema: string | null = null;

/**
 * Query information_schema once and return a compact text representation
 * of all tables/views and their columns. Result is cached after first call.
 */
export async function getSchemaText(): Promise<string> {
  if (cachedSchema) return cachedSchema;

  const cols = await query<ColumnInfo>(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'main'
    ORDER BY table_name, ordinal_position
  `);

  // Group by table
  const tables = new Map<string, { column_name: string; data_type: string }[]>();
  for (const col of cols) {
    if (!tables.has(col.table_name)) tables.set(col.table_name, []);
    tables.get(col.table_name)!.push({ column_name: col.column_name, data_type: col.data_type });
  }

  const lines: string[] = [];
  for (const [table, columns] of tables) {
    const colStr = columns.map(c => `${c.column_name} (${c.data_type})`).join(', ');
    lines.push(`- **${table}**: ${colStr}`);
  }

  cachedSchema = lines.join('\n');
  return cachedSchema;
}
