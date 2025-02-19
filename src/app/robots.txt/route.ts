// app/robots.txt/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse(
    `User-agent: *
Allow: /
Sitemap: https://lookmate.kro.kr/sitemap.xml
`,
    {
      headers: {
        "Content-Type": "text/plain",
      },
    }
  );
}
