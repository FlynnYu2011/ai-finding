import { env } from 'cloudflare:workers';
import { createItemsSearchIndex, createItemsTable } from '@/db/schema';

export type ItemRecord = {
  id: string; category: string; color: string; material: string;
  features: string; public_description: string; private_features: string;
  image_key: string | null; found_location: string; found_time: string;
  status: string; created_at: string;
};

export async function db() {
  const binding = (env as unknown as { DB: D1Database }).DB;
  await binding.batch([
    binding.prepare(createItemsTable),
    binding.prepare(createItemsSearchIndex),
  ]);
  return binding;
}

export function bucket() {
  return (env as unknown as { BUCKET: R2Bucket }).BUCKET;
}

export async function understand(input: string, image?: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is not configured');
  const content: Array<Record<string, string>> = [{ type: 'input_text', text: input }];
  if (image) content.push({ type: 'input_image', image_url: image });
  const response = await fetch('https://api.deepseek.com/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: image ? 'deepseek-v4-flash-vision-exp' : 'deepseek-v4-flash',
      input: [{ role: 'user', content }],
      text: { format: { type: 'json_schema', name: 'lost_item', strict: true, schema: {
        type: 'object', additionalProperties: false,
        properties: {
          category: { type: 'string' }, color: { type: 'string' }, material: { type: 'string' },
          features: { type: 'array', items: { type: 'string' } },
          location: { type: 'string' }, time: { type: 'string' },
        },
        required: ['category', 'color', 'material', 'features', 'location', 'time'],
      }}},
      store: false,
    }),
  });
  if (!response.ok) throw new Error(`DeepSeek request failed: ${response.status}`);
  const data = await response.json() as { output_text?: string };
  if (!data.output_text) throw new Error('DeepSeek returned no structured output');
  return JSON.parse(data.output_text) as { category: string; color: string; material: string; features: string[]; location: string; time: string };
}
