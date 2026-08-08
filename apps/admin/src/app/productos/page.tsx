import Link from 'next/link';
import { PackageOpen } from 'lucide-react';
import ProductosList from './ProductosList';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function getProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/products`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    return [];
  }
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="animate-enter w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900">Productos</h1>
          <p className="text-gray-500 mt-2">Listado de prendas y productos disponibles para tus clientas</p>
        </div>
        <Link 
          href="/productos/nuevo"
          className="bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-sm"
        >
          + Subir Producto
        </Link>
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
        {products.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center">
            <PackageOpen className="text-gray-300 mb-4" size={48} strokeWidth={1} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No hay productos</h3>
            <p className="text-gray-500 mb-6">Comienza añadiendo tu primer producto al catálogo.</p>
            <Link 
              href="/productos/nuevo"
              className="inline-block bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white px-6 py-3 rounded-xl font-bold transition-colors"
            >
              Crear Producto
            </Link>
          </div>
        ) : (
          <ProductosList initialProducts={products} />
        )}
      </div>
    </div>
  );
}
