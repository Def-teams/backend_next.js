import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lookmate.kro.kr';
  
  // 동적 경로 생성 로직
  const dynamicRoutes = await generateDynamicRoutes();

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...dynamicRoutes
  ];
}

async function generateDynamicRoutes() {
  // DB에서 동적 경로 조회
  const products = await fetchProducts();
  return products.map(product => ({
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/products/${product.id}`,
    lastModified: product.updatedAt,
  }));
} 