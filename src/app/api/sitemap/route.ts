export async function GET() {
  const urls = [
    { url: '/', lastModified: new Date() },
    { url: '/auth/google', lastModified: new Date() },
    { url: '/api/auth/google/callback', lastModified: new Date() }
  ];

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urls.map(url => `
        <url>
          <loc>https://lookmate.kro.kr${url.url}</loc>
          <lastmod>${url.lastModified.toISOString()}</lastmod>
          <changefreq>daily</changefreq>
          <priority>0.8</priority>
        </url>
      `).join('')}
    </urlset>`,
    {
      headers: {
        'Content-Type': 'application/xml'
      }
    }
  );
} 