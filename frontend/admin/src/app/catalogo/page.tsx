import Link from 'next/link';
import { Tag } from 'lucide-react';
import CatalogoList from './CatalogoList';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function getCatalogos() {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    return [];
  }
}

export default async function CatalogosPage() {
  const catalogos = await getCatalogos();

  return (
    <div className="animate-enter w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900">Catálogo</h1>
          <p className="text-gray-500 mt-2">Categorías principales de prendas para organizar tu tienda (Ej. Vestidos, Knitwear)</p>
        </div>
        <Link 
          href="/catalogo/nuevo"
          className="bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-sm"
        >
          + Nuevo Tipo de Prenda
        </Link>
      </div>

      {/* Tip / Sizing info */}
      <div className="bg-[#FAF6F6] border border-[#8B5A5A]/15 rounded-[1.5rem] p-5 mb-8 flex gap-4 items-start shadow-sm">
        <div className="bg-[#8B5A5A] text-white p-2 rounded-xl flex items-center justify-center flex-shrink-0">
          <Tag size={18} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#4A3E38] mb-1">💡 ¿Cómo se muestran en la web?</h4>
          <p className="text-xs text-gray-600 leading-relaxed max-w-3xl">
            En la página principal, estas categorías (Tipos de Prenda) aparecen en un gran carrusel horizontal. Te sugerimos subir fotografías grandes y de alta calidad para que los clientes aprecien el tipo de prenda desde el primer vistazo.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
        {catalogos.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center">
            <Tag className="text-gray-300 mb-4" size={48} strokeWidth={1} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No hay tipos de prenda</h3>
            <p className="text-gray-500 mb-6">Comienza creando tu primera categoría en el catálogo.</p>
            <Link 
              href="/catalogo/nuevo"
              className="inline-block bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white px-6 py-3 rounded-xl font-bold transition-colors"
            >
              Crear Tipo de Prenda
            </Link>
          </div>
        ) : (
          <CatalogoList initialCatalogos={catalogos} />
        )}
      </div>
    </div>
  );
}
