import { NextResponse } from 'next/server';
import { bucket, db } from '@/lib/server';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { category: string; color: string; material?: string; features: string[]; location: string; time: string; image?: string; privateFeatures?: string };
    const id = crypto.randomUUID();
    let imageKey: string | null = null;
    if (body.image?.startsWith('data:image/')) {
      const match = body.image.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (match) {
        imageKey = `lost-items/${id}`;
        await bucket().put(imageKey, Uint8Array.from(atob(match[2]), c => c.charCodeAt(0)), { httpMetadata: { contentType: match[1] } });
      }
    }
    const database = await db();
    await database.prepare(`INSERT INTO lost_items
      (id, category, color, material, features, public_description, private_features, image_key, found_location, found_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, body.category, body.color, body.material ?? '', JSON.stringify(body.features), body.features.join('、'), body.privateFeatures ?? '', imageKey, body.location, body.time).run();
    return NextResponse.json({ id, ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '登记失败' }, { status: 500 });
  }
}

export async function GET() {
  const database = await db();
  const result = await database.prepare('SELECT * FROM lost_items WHERE status = ? ORDER BY created_at DESC LIMIT 50').bind('available').all();
  return NextResponse.json(result.results);
}
