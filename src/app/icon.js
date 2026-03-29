import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default async function Icon() {
  const n8nUrl = process.env.NEXT_PUBLIC_N8N_API_URL || 'https://n8n.srv1155211.hstgr.cloud/webhook';
  
  try {
    // 1. Get the favicon URL from your n8n/Sheets API
    const res = await fetch(`${n8nUrl}/menu?t=${Date.now()}`, {
      next: { revalidate: 300 }
    });
    const data = await res.json();
    const faviconUrl = data.store?.faviconUrl;

    if (!faviconUrl) {
      // Fallback to a simple text-based icon or default if not found
      return new ImageResponse(
        (
          <div style={{
            fontSize: 24,
            background: '#FF5200',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            borderRadius: '4px'
          }}>
            🍳
          </div>
        ),
        { ...size }
      );
    }

    // 2. Return the image from your URL
    // We fetch it and return it so it's served from your domain
    const imageRes = await fetch(faviconUrl);
    const blob = await imageRes.blob();
    const buffer = await blob.arrayBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': imageRes.headers.get('content-type') || 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (e) {
    console.error('Dynamic Icon Error:', e);
    return new Response(null, { status: 500 });
  }
}
