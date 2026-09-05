import { NextResponse } from 'next/server';
import { db, understand, type ItemRecord } from '@/lib/server';

function includes(a: string, b: string) { return a && b && (a.includes(b) || b.includes(a)); }

export async function POST(request: Request) {
  try {
    const { query } = await request.json() as { query?: string };
    if (!query?.trim()) return NextResponse.json({ error: '请输入失物描述' }, { status: 400 });
    const parsed = await understand(`从学生描述中提取遗失物品信息：${query}`);
    const database = await db();
    const rows = (await database.prepare('SELECT * FROM lost_items WHERE status = ? ORDER BY created_at DESC LIMIT 100').bind('available').all()).results as unknown as ItemRecord[];
    const ranked = rows.map(item => {
      const features = JSON.parse(item.features || '[]') as string[];
      const visual = includes(item.category, parsed.category) ? 1 : 0.25;
      const text = [...parsed.features, parsed.color].filter(x => [item.color, ...features].some(y => includes(x, y))).length / Math.max(parsed.features.length + 1, 1);
      const place = includes(item.found_location, parsed.location) ? 1 : 0.2;
      const time = includes(item.found_time, parsed.time) ? 1 : 0.4;
      return { ...item, features, score: Math.round((visual * .5 + text * .25 + place * .15 + time * .1) * 100) };
    }).sort((a, b) => b.score - a.score).slice(0, 3);
    return NextResponse.json({ parsed, matches: ranked });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '搜索失败' }, { status: 500 });
  }
}
