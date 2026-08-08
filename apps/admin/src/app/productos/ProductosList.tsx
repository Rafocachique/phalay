'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DeleteButton } from '@/components/DeleteButton';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { reorderProducts } from '@/app/actions/products';

export default function ProductosList({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [isUpdating, setIsUpdating] = useState(false);

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    if (isUpdating) return;
    
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === products.length - 1) return;

    const newProducts = [...products];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap items
    const temp = newProducts[index];
    newProducts[index] = newProducts[swapIndex];
    newProducts[swapIndex] = temp;

    setProducts(newProducts);
    setIsUpdating(true);

    try {
      const ids = newProducts.map(p => p.id);
      const result = await reorderProducts(ids);
      if ('error' in result) throw new Error(result.error);
      toast.success('Orden actualizado');
    } catch (error) {
      toast.error('Hubo un error al guardar el orden');
      setProducts(products); // revert
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
            <th className="pb-4 font-bold text-sm text-gray-500 uppercase tracking-wider">Producto</th>
            <th className="pb-4 font-bold text-sm text-gray-500 uppercase tracking-wider">Precio</th>
            <th className="pb-4 font-bold text-sm text-gray-500 uppercase tracking-wider">Stock</th>
            <th className="pb-4 font-bold text-sm text-gray-500 uppercase tracking-wider">Ventas</th>
            <th className="pb-4 font-bold text-sm text-gray-500 uppercase tracking-wider text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {products.map((prod: any, index: number) => {
            const totalStock = prod.variants?.reduce((acc: number, v: any) => acc + (v.stock || 0), 0) || 0;
            return (
            <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
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
                    disabled={index === products.length - 1 || isUpdating}
                    className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
              </td>
              <td className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                    {prod.images && prod.images.length > 0 ? (
                      <img src={prod.images[0].url} alt={prod.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">IMG</div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900">{prod.name}</p>
                      {prod.featured && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2 py-0.5 rounded">Destacado</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate max-w-xs">{prod.sku || 'Sin SKU'}</p>
                  </div>
                </div>
              </td>
              <td className="py-4 text-gray-500 font-medium">
                S/ {prod.price}
              </td>
              <td className="py-4">
                <span className={`font-bold ${totalStock === 0 ? 'text-red-500' : totalStock <= 5 ? 'text-amber-500' : 'text-gray-900'}`}>
                  {totalStock} unid.
                </span>
              </td>
              <td className="py-4 text-gray-500 font-medium">
                {prod.totalSold}
              </td>
              <td className="py-4 text-right space-x-3">
                <Link href={`/productos/${prod.id}/editar`} className="text-[#8B5A5A] hover:text-[#6A3F3F] font-bold text-sm transition-colors">
                  Editar
                </Link>
                <DeleteButton 
                  id={prod.id}
                  type="product"
                  entityName={`el producto "${prod.name}"`} 
                  className="text-red-500 hover:text-red-700 font-bold text-sm transition-colors" 
                />
              </td>
            </tr>
          )})}
        </tbody>
      </table>
    </div>
  );
}
