import { tool } from 'ai';
import { z } from 'zod';
import { searchHospitals } from '@/lib/duckdb/queries/hospitals';
import { query } from '@/lib/duckdb/instance';
import type { WidgetSpec } from './types';

const widgetLayoutSchema = {
  width:  z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2).describe('Grid columns: 1=narrow, 2=default, 3=full-width'),
  height: z.union([z.literal(1), z.literal(2)]).default(1).describe('Grid rows: 1=normal, 2=tall'),
};

export const agentTools = {
  search_hospitals: tool({
    description: 'Search for hospitals by name, state, city, or zip code. Returns a list of matching hospitals with their IDs.',
    inputSchema: z.object({
      name:  z.string().optional().describe('Hospital name (partial match)'),
      state: z.string().max(2).optional().describe('2-letter state abbreviation'),
      city:  z.string().optional().describe('City name'),
      zip:   z.string().optional().describe('ZIP code'),
    }),
    execute: async (input) => {
      const { hospitals } = await searchHospitals({ ...input, limit: 20 });
      return hospitals.map((h) => ({
        facility_id:   h.facility_id,
        facility_name: h.facility_name,
        city:          h.city,
        state:         h.state,
        hospital_type: h.hospital_type,
        star_rating:   h.star_rating,
      }));
    },
  }),

  get_schema_info: tool({
    description: 'Get database schema information. Use this to understand available tables and columns before writing SQL queries.',
    inputSchema: z.object({
      table_name: z.string().optional().describe('Specific view/table name to get columns for. Omit to list all tables.'),
    }),
    execute: async (input) => {
      if (input.table_name) {
        const cols = await query<{ column_name: string; data_type: string }>(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = '${input.table_name.replace(/'/g, "''")}' AND table_schema = 'main'
          ORDER BY ordinal_position
        `);
        return { table: input.table_name, columns: cols };
      }
      const tables = await query<{ table_name: string }>(`
        SELECT DISTINCT table_name FROM information_schema.columns
        WHERE table_schema = 'main' ORDER BY table_name
      `);
      return { tables: tables.map((t) => t.table_name) };
    },
  }),

  create_metric_widget: tool({
    description: 'Create a KPI metric card showing a single key value. The SQL query MUST return exactly one row.',
    inputSchema: z.object({
      title:      z.string().describe('Widget title'),
      sql:        z.string().describe('SQL SELECT returning exactly one row with the metric'),
      metric_key: z.string().describe('Column name in the result to display as the main value'),
      format:     z.enum(['number', 'percent', 'currency', 'ratio']).default('number'),
      comparison: z.object({ value: z.number(), label: z.string() }).optional(),
      ...widgetLayoutSchema,
    }),
    execute: async (input): Promise<WidgetSpec> => ({
      id:         crypto.randomUUID(),
      type:       'metric',
      title:      input.title,
      sql:        input.sql,
      metricKey:  input.metric_key,
      format:     input.format,
      comparison: input.comparison,
      width:      input.width,
      height:     input.height,
    }),
  }),

  create_chart_widget: tool({
    description: 'Create a chart visualization (bar, line, scatter, or pie). Write SQL that returns the data for the chart axes.',
    inputSchema: z.object({
      title:           z.string(),
      sql:             z.string().describe('SQL query returning chart data rows'),
      chart_type:      z.enum(['bar', 'line', 'scatter', 'pie']),
      x_key:           z.string().describe('Column name for the X axis or category'),
      y_keys:          z.array(z.string()).describe('Column names for Y axis values (can be multiple for grouped bars)'),
      x_label:         z.string().optional(),
      y_label:         z.string().optional(),
      colors:          z.array(z.string()).optional(),
      stacked:         z.boolean().optional().default(false),
      reference_lines: z.array(z.object({ value: z.number(), label: z.string(), color: z.string() })).optional(),
      ...widgetLayoutSchema,
    }),
    execute: async (input): Promise<WidgetSpec> => ({
      id:        crypto.randomUUID(),
      type:      'chart',
      title:     input.title,
      sql:       input.sql,
      chartType: input.chart_type,
      chartConfig: {
        xKey:           input.x_key,
        yKeys:          input.y_keys,
        xLabel:         input.x_label,
        yLabel:         input.y_label,
        colors:         input.colors,
        stacked:        input.stacked,
        showLegend:     true,
        referenceLines: input.reference_lines,
      },
      width:  input.width,
      height: input.height,
    }),
  }),

  create_table_widget: tool({
    description: 'Create a sortable data table. Write SQL that returns the rows to display (max 50 rows recommended).',
    inputSchema: z.object({
      title:   z.string(),
      sql:     z.string().describe('SQL query returning table rows'),
      columns: z.array(z.object({
        key:      z.string().describe('Column name from SQL result'),
        header:   z.string().describe('Display header text'),
        format:   z.enum(['number', 'percent', 'currency', 'date', 'badge', 'ratio']).optional(),
        sortable: z.boolean().optional().default(true),
      })).describe('Column definitions for the table'),
      ...widgetLayoutSchema,
    }),
    execute: async (input): Promise<WidgetSpec> => ({
      id:      crypto.randomUUID(),
      type:    'table',
      title:   input.title,
      sql:     input.sql,
      columns: input.columns,
      width:   input.width,
      height:  input.height,
    }),
  }),

  create_text_widget: tool({
    description: 'Create a markdown text widget for analysis summaries, methodology notes, or caveats.',
    inputSchema: z.object({
      content: z.string().describe('Markdown content to display'),
      title:   z.string().optional().default('Analysis'),
      ...widgetLayoutSchema,
    }),
    execute: async (input): Promise<WidgetSpec> => ({
      id:      crypto.randomUUID(),
      type:    'text',
      title:   input.title ?? 'Analysis',
      content: input.content,
      width:   input.width,
      height:  input.height,
    }),
  }),
};
