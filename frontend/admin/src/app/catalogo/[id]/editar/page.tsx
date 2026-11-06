import { notFound } from 'next/navigation';
import EditarCatalogoForm from './EditarCatalogoForm';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function getCatalogo(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/categories/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    return null;
  }
}

export default async function EditarCatalogoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const catalogo = await getCatalogo(id);

  if (!catalogo) {
    notFound();
  }

  return (
    <div className="animate-enter w-full">
      <EditarCatalogoForm catalogo={catalogo} />
    </div>
  );
}
