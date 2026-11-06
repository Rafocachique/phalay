import { notFound } from 'next/navigation';
import EditarColeccionForm from './EditarColeccionForm';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function getCollection(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/collections/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    return null;
  }
}

export default async function EditarColeccionPage({ params }: { params: any }) {
  const { id } = await params;
  const collection = await getCollection(id);

  if (!collection) {
    notFound();
  }

  return <EditarColeccionForm collection={collection} />;
}
