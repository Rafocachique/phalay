'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DeleteButton } from '@/components/DeleteButton';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { reorderCatalogo } from '@/app/actions/catalog';

export default function CatalogoList({ initialCatalogos }: { initialCatalogos: any[] }) {
  const [catalogos, setCatalogos] = useState(initialCatalogos);
  const [isUpdating, setIsUpdating] = useState(false);

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    if (isUpdating) return;
    
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === catalogos.length - 1) return;

    const newCatalogos = [...catalogos];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap items
    const temp = newCatalogos[index];
    newCatalogos[index] = newCatalogos[swapIndex];
    newCatalogos[swapIndex] = temp;

    setCatalogos(newCatalogos);
    setIsUpdating(true);

    try {
      const ids = newCatalogos.map(c => c.id);
      const result = await reorderCatalogo(ids);
      if (!result.success) throw new Error(result.error);
      toast.success('Orden actualizado');
    } catch (error) {
      toast.error('Hubo un error al guardar el orden');
      setCatalogos(catalogos); // revert
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="pb-4 font-bold text-sm text-gray-500 uppercase tracking-wider w-24">Orden</th>
            <th className="pb-4 font-bold text-sm text-gray-500 uppercase tracking-wider">Tipo de Prenda</th>
            <th className="pb-4 font-bold text-sm text-gray-500 uppercase tracking-wider text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {catalogos.map((cat: any, index: number) => (
            <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-4">
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0 || isUpdating}
                    className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button 
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === catalogos.length - 1 || isUpdating}
                    className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
              </td>
              <td className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">IMG</div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{cat.name}</p>
                    <p className="text-sm text-gray-500 truncate max-w-xs">{cat.slug}</p>
                  </div>
                </div>
              </td>
              <td className="py-4 text-right space-x-3">
                <Link href={`/catalogo/${cat.id}/editar`} className="text-[#8B5A5A] hover:text-[#6A3F3F] font-bold text-sm transition-colors">
                    Editar
                </Link>
                <DeleteButton 
                  id={cat.id}
                  type="catalog"
                  entityName={`el tipo de prenda "${cat.name}"`} 
                  className="text-red-500 hover:text-red-700 font-bold text-sm transition-colors" 
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
