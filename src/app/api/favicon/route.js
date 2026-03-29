export const runtime = 'edge';

export async function GET() {
  const n8nUrl = process.env.NEXT_PUBLIC_N8N_API_URL || 'https://n8n.srv1155211.hstgr.cloud/webhook';
  
  try {
    // 1. Fetch menu/settings to get the favicon URL
    const menuRes = await fetch(`${n8nUrl}/menu?t=${Date.now()}`, {
      next: { revalidate: 300 } // Cache for 5 mins
    });
    
    if (!menuRes.ok) throw new Error('Failed to fetch menu');
    const data = await menuRes.json();
    const faviconUrl = data.store?.faviconUrl;

    if (!faviconUrl) {
      return new Response('No favicon found', { status: 404 });
    }

    // 2. Fetch the actual image
    const imageRes = await fetch(faviconUrl);
    if (!imageRes.ok) throw new Error('Failed to fetch image');

    const contentType = imageRes.headers.get('content-type') || 'image/x-icon';
    const buffer = await imageRes.arrayBuffer();

    // 3. Return the image with proper headers
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache browser-side for 1 hour
      },
    });
  } catch (error) {
    console.error('Favicon API Error:', error);
    return new Response('Error loading favicon', { status: 500 });
  }
}
