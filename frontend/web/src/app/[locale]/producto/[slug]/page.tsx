import { notFound } from 'next/navigation';
import ProductoClient from './ProductoClient';
import { ProductsService } from '@/lib/services/products.service';

export default async function ProductoPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug } = await params;
  let product = null;

  try {
    product = await ProductsService.getProductBySlug(slug);
  } catch (error) {
    console.error(`Error fetching product by slug [${slug}]:`, error);
  }

  // Sin producto real no hay nada que mostrar: 404 en vez de datos inventados.
  if (!product) {
    notFound();
  }

  return <ProductoClient product={product} />;
}
