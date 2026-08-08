import Link from 'next/link';
import { Layers } from 'lucide-react';
import ColeccionesList from './ColeccionesList';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function getCollections() {
  try {
    const res = await fetch(`${API_BASE_URL}/collections`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    return [];
  }
}

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <div className="animate-enter w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900">Colecciones</h1>
          <p className="text-gray-500 mt-2">Agrupaciones de temporada y campañas destacadas en portada</p>
        </div>
        <Link 
          href="/colecciones/nuevo"
          className="bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-sm"
        >
          + Nueva Colección
        </Link>
      </div>

      {/* Tip / Sizing info */}
      <div className="bg-[#FAF6F6] border border-[#8B5A5A]/15 rounded-[1.5rem] p-5 mb-8 flex gap-4 items-start shadow-sm">
        <div className="bg-[#8B5A5A] text-white p-2 rounded-xl flex items-center justify-center flex-shrink-0">
          <Layers size={18} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#4A3E38] mb-1">💡 ¿Cómo se muestran las colecciones en la web?</h4>
          <p className="text-xs text-gray-600 leading-relaxed max-w-3xl">
            En la página de inicio (Landing Page), la <strong>primera colección</strong> activa se destaca a gran tamaño en el lado izquierdo (Colección Principal).
            Las <strong>siguientes 3 colecciones</strong> completan de forma automática la cuadrícula lateral derecha en menor tamaño. 
            Te sugerimos utilizar imágenes de alta calidad (mínimo 1200x800 px) para que luzcan elegantes y sofisticadas.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
        {collections.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center">
            <Layers className="text-gray-300 mb-4" size={48} strokeWidth={1} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No hay colecciones</h3>
            <p className="text-gray-500 mb-6">Comienza creando tu primera colección para agrupar productos.</p>
            <Link 
              href="/colecciones/nuevo"
              className="inline-block bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white px-6 py-3 rounded-xl font-bold transition-colors"
            >
              Crear Colección
            </Link>
          </div>
        ) : (
          <ColeccionesList initialCollections={collections} />
        )}
      </div>
    </div>
  );
}
