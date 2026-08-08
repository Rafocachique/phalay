import Link from 'next/link';
import { ProductsService } from '@/lib/services/products.service';
import { fetchApi } from '@/lib/api-client';

interface PageProps {
  searchParams: Promise<{
    coleccion?: string;
    categoria?: string;
    search?: string;
  }>;
}

export default async function CatalogoPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const collectionId = params.coleccion;
  const categoryName = params.categoria;

  let products: any[] = [];
  try {
    products = await ProductsService.getProducts();
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  // Fetch collection name dynamically if filtered by collection
  let collectionName = '';
  if (collectionId) {
    try {
      const col = await fetchApi<any>(`/collections/${collectionId}`);
      if (col && col.name) {
        collectionName = col.name;
      }
    } catch (error) {
      console.error("Error fetching collection details:", error);
    }
  }

  // Filter products based on searchParams
  let displayProducts = products;
  if (collectionId) {
    displayProducts = products.filter((p: any) => 
      Array.isArray(p.collections) && p.collections.some((col: any) => col.id === collectionId)
    );
  } else if (categoryName) {
    displayProducts = products.filter((p: any) => 
      p.category?.name?.toLowerCase() === categoryName.toLowerCase() ||
      p.category?.slug?.toLowerCase() === categoryName.toLowerCase()
    );
  }

  const finalProducts = displayProducts;

  return (
    <div className="min-h-screen bg-[#F8F8F8] py-8">
      <main className="max-w-[1400px] mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">
        {/* Sidebar Filtros */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white p-6 border border-gray-100 rounded-[2rem] shadow-sm sticky top-28">
            <h2 className="text-xl font-serif text-gray-900 mb-8">Filtros</h2>
            
            {/* Categoría */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-gray-700 tracking-widest uppercase mb-4">Catálogos</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <Link href="/catalogo?categoria=Vestidos%20de%20Gala" className="flex items-center gap-3 hover:text-[#8B5A5A] transition-colors">
                  <span className="w-2 h-2 rounded-full bg-gray-200"></span>
                  <span>Vestidos de Gala</span>
                </Link>
                <Link href="/catalogo?categoria=Sastrería%20Moderna" className="flex items-center gap-3 hover:text-[#8B5A5A] transition-colors">
                  <span className="w-2 h-2 rounded-full bg-gray-200"></span>
                  <span>Sastrería Moderna</span>
                </Link>
              </div>
            </div>

            {/* Talla */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-gray-700 tracking-widest uppercase mb-4">Talla</h3>
              <div className="flex gap-2">
                <button className="w-10 h-8 border border-gray-100 rounded-lg text-xs text-gray-600 hover:border-gray-900 transition-colors">XS</button>
                <button className="w-10 h-8 bg-black rounded-lg text-white text-xs font-bold">S</button>
                <button className="w-10 h-8 border border-gray-100 rounded-lg text-xs text-gray-600 hover:border-gray-900 transition-colors">M</button>
                <button className="w-10 h-8 border border-gray-100 rounded-lg text-xs text-gray-600 hover:border-gray-900 transition-colors">L</button>
              </div>
            </div>

            {/* Color */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-gray-700 tracking-widest uppercase mb-4">Color</h3>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#EBE6E0] border border-gray-300 ring-1 ring-offset-2 ring-black cursor-pointer"></div>
                <div className="w-6 h-6 rounded-full bg-black cursor-pointer"></div>
                <div className="w-6 h-6 rounded-full bg-[#F5F5F5] border border-gray-200 cursor-pointer"></div>
                <div className="w-6 h-6 rounded-full bg-[#D1BFAe] cursor-pointer"></div>
              </div>
            </div>

            {/* Precio */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-gray-700 tracking-widest uppercase mb-4">Precio</h3>
              <div className="relative h-1 bg-gray-200 mb-4 rounded">
                <div className="absolute left-1/4 right-0 h-1 bg-black rounded"></div>
                <div className="absolute left-1/4 -mt-1.5 w-4 h-4 bg-black rounded-full border-2 border-white shadow"></div>
              </div>
              <div className="flex justify-between text-xs font-medium text-gray-500">
                <span>S/ 150</span>
                <span>S/ 2,500</span>
              </div>
            </div>

            <Link href="/catalogo" className="block text-center w-full bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white py-3 rounded-xl text-xs font-bold tracking-widest uppercase transition-colors shadow-sm">
              Limpiar Filtros
            </Link>
          </div>
        </aside>

        {/* Grid de Productos */}
        <div className="flex-1">
          <div className="flex justify-between items-end mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-serif text-gray-900 mb-1">
                {collectionName ? `Colección: ${collectionName}` : categoryName ? `Catálogo: ${categoryName}` : 'Catálogo Digital'}
              </h1>
              <p className="text-sm text-gray-500">
                {finalProducts.length} {finalProducts.length === 1 ? 'diseño exclusivo' : 'diseños exclusivos'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Ordenar por:</span>
              <select className="bg-transparent font-bold text-gray-900 outline-none cursor-pointer">
                <option>Tendencias</option>
                <option>Menor Precio</option>
                <option>Mayor Precio</option>
              </select>
            </div>
          </div>

          {/* Active Filter Badge */}
          {(collectionId || categoryName) && (
            <div className="mb-8 flex flex-wrap gap-2 items-center animate-enter">
              <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Filtro Activo:</span>
              <span className="inline-flex items-center gap-2 bg-[#FBEFEF] text-[#8B5A5A] px-4 py-1.5 rounded-full text-xs font-bold border border-[#8B5A5A]/10 shadow-sm">
                {collectionName ? `Colección: ${collectionName}` : `Catálogo: ${categoryName}`}
                <Link href="/catalogo" className="hover:bg-red-200 hover:text-red-800 bg-white/50 text-[#8B5A5A] w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black transition-colors">&times;</Link>
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {finalProducts.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
                <p className="text-gray-500 font-serif text-lg">No hay productos disponibles en esta sección.</p>
                <p className="text-xs text-gray-400 mt-2">Estamos preparando nuestras próximas piezas exclusivas.</p>
                <Link href="/catalogo" className="inline-block mt-6 bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white px-6 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-colors shadow-sm">
                  Ver todo el catálogo
                </Link>
              </div>
            ) : (
              finalProducts.map((p) => (
                <div key={p.id} className="group cursor-pointer animate-enter">
                  <Link href={`/producto/${p.slug}`}>
                    <div className="relative aspect-[3/4] bg-gray-100 mb-4 overflow-hidden rounded-[2rem] border border-gray-100">
                      <img src={p.images?.[0]?.url || 'https://via.placeholder.com/600x800'} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#8B5A5A] group-hover:underline transition-colors">{p.name}</h3>
                      <span className="text-sm font-bold text-gray-900">S/ {typeof p.price === 'number' ? p.price.toFixed(2) : parseFloat(p.price || '0').toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{p.shortDescription || 'Diseño exclusivo de alta costura'}</p>
                  </Link>
                </div>
              ))
            )}
          </div>

          {finalProducts.length > 0 && (
            <div className="mt-16 flex justify-center items-center gap-4 border-t border-gray-100 pt-8">
              <button className="w-10 h-10 flex items-center justify-center border border-gray-100 rounded-xl text-gray-500 hover:text-black transition-colors">&lt;</button>
              <span className="text-xs font-bold tracking-widest text-gray-900">PÁGINA 1 DE 1</span>
              <button className="w-10 h-10 flex items-center justify-center border border-gray-100 rounded-xl text-gray-500 hover:text-black transition-colors">&gt;</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
