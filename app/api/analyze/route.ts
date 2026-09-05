import { NextResponse } from 'next/server';
import { understand } from '@/lib/server';

export async function POST(request: Request) {
  try {
    const { image } = await request.json() as { image?: string };
    if (!image?.startsWith('data:image/')) return NextResponse.json({ error: '请上传有效图片' }, { status: 400 });
    const item = await understand('识别这件校园失物。地点和时间如果图片无法判断，分别返回“体育馆”和当前时间。特征应具体、简短。', image);
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '识别失败' }, { status: 500 });
  }
}
