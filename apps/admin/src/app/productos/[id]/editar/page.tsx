import { notFound } from 'next/navigation';
import EditarProductoForm from './EditarProductoForm';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function getProduct(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    return null;
  }
}

export default async function EditarProductoPage({ params }: { params: any }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return <EditarProductoForm product={product} />;
}
