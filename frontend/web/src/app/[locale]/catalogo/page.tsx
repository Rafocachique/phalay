import Link from 'next/link';
import { ProductsService } from '@/lib/services/products.service';
import { fetchApi } from '@/lib/api-client';
import CatalogFilters from './CatalogFilters';
import SortSelector from './SortSelector';

interface PageProps {
  searchParams: Promise<{
    coleccion?: string;
    categoria?: string;
    search?: string;
    talla?: string;
    color?: string;
    maxPrice?: string;
    sort?: string;
  }>;
}

export default async function CatalogoPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const collectionId = params.coleccion;
  const categoryName = params.categoria; // Can be comma-separated list: "Blusas,Casacas"
  const sizeFilter = params.talla;
  const colorFilter = params.color;
  const sortFilter = params.sort || 'tendencias';
  const searchQuery = params.search;

  let products: any[] = [];
  let categories: any[] = [];

  try {
    // Fetch products disabling Next.js cache to ensure fresh DB state and category relation
    products = await ProductsService.getProducts();
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  try {
    categories = await fetchApi<any[]>('/products/categories', { cache: 'no-store' });
  } catch (error) {
    console.error("Error fetching categories:", error);
  }

  // Parse category list from query parameter
  const selectedCategories = categoryName 
    ? categoryName.split(',').filter(Boolean)
    : [];

  const productPrices = products.map((p: any) => parseFloat(p.price)).filter(p => !isNaN(p));
  // Margen de 10 soles al mínimo (mínimo 0) y 20 soles al máximo para mejorar la usabilidad del slider
  const minAvailablePrice = productPrices.length > 0 
    ? Math.max(0, Math.floor(Math.min(...productPrices)) - 10) 
    : 100;
  const maxAvailablePrice = productPrices.length > 0 
    ? Math.ceil(Math.max(...productPrices)) + 20 
    : 2500;

  const maxPriceFilter = params.maxPrice ? parseFloat(params.maxPrice) : maxAvailablePrice;

  // Fetch collection name dynamically if filtered by collection
  let collectionName = '';
  if (collectionId) {
    try {
      const col = await fetchApi<any>(`/collections/${collectionId}`, { cache: 'no-store' });
      if (col && col.name) {
        collectionName = col.name;
      }
    } catch (error) {
      console.error("Error fetching collection details:", error);
    }
  }

  // Extract unique sizes and colors dynamically from all active products
  const standardSizes = ['XS', 'S', 'M', 'L', 'XL'];
  const extractedSizes = Array.from(
    new Set(products.flatMap((p: any) => p.variants?.map((v: any) => v.size) || []).filter(Boolean))
  ) as string[];
  const sizes = extractedSizes.length > 0 
    ? standardSizes.filter(s => extractedSizes.includes(s) || extractedSizes.some(es => es.toUpperCase() === s))
    : standardSizes;

  const colorsMap = new Map<string, string>();
  products.forEach((p: any) => {
    p.variants?.forEach((v: any) => {
      if (v.color) {
        colorsMap.set(v.color, v.colorHex || '#cccccc');
      }
    });
  });
  const colors = Array.from(colorsMap.entries()).map(([name, hex]) => ({ name, hex }));

  // Apply filters on the products list
  let displayProducts = [...products];

  // 1. Filter by collection
  if (collectionId) {
    displayProducts = displayProducts.filter((p: any) => 
      Array.isArray(p.collections) && p.collections.some((col: any) => col.id === collectionId)
    );
  }

  // 2. Filter by category (handles multiple selected categories)
  if (selectedCategories.length > 0) {
    const lowerSelected = selectedCategories.map(c => c.toLowerCase());
    displayProducts = displayProducts.filter((p: any) => 
      (p.category?.name && lowerSelected.includes(p.category.name.toLowerCase())) ||
      (p.category?.slug && lowerSelected.includes(p.category.slug.toLowerCase()))
    );
  }

  // 3. Filter by size
  if (sizeFilter) {
    displayProducts = displayProducts.filter((p: any) => 
      p.variants?.some((v: any) => v.size?.toUpperCase() === sizeFilter.toUpperCase() && v.stock > 0)
    );
  }

  // 4. Filter by color
  if (colorFilter) {
    displayProducts = displayProducts.filter((p: any) => 
      p.variants?.some((v: any) => v.color?.toLowerCase() === colorFilter.toLowerCase() && v.stock > 0)
    );
  }

  // 5. Filter by price using the active or dynamic maxPrice
  displayProducts = displayProducts.filter((p: any) => 
    parseFloat(p.price) <= maxPriceFilter
  );

  // 6. Filter by search bar query
  if (searchQuery) {
    displayProducts = displayProducts.filter((p: any) => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.shortDescription && p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }

  // Apply sorting
  if (sortFilter === 'precio_asc') {
    displayProducts.sort((a: any, b: any) => parseFloat(a.price) - parseFloat(b.price));
  } else if (sortFilter === 'precio_desc') {
    displayProducts.sort((a: any, b: any) => parseFloat(b.price) - parseFloat(a.price));
  } else {
    // default (tendencias / position + date)
    displayProducts.sort((a: any, b: any) => {
      if (a.position !== b.position) {
        return a.position - b.position;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  // Helper to build URL excluding a specific param (for active filter badges close button)
  const getBadgeLink = (paramToRemove: string) => {
    const queryParts = [];
    if (paramToRemove !== 'coleccion' && collectionId) queryParts.push(`coleccion=${collectionId}`);
    if (paramToRemove !== 'categoria' && categoryName) queryParts.push(`categoria=${encodeURIComponent(categoryName)}`);
    if (paramToRemove !== 'talla' && sizeFilter) queryParts.push(`talla=${sizeFilter}`);
    if (paramToRemove !== 'color' && colorFilter) queryParts.push(`color=${encodeURIComponent(colorFilter)}`);
    if (paramToRemove !== 'maxPrice' && params.maxPrice) queryParts.push(`maxPrice=${params.maxPrice}`);
    if (sortFilter !== 'tendencias') queryParts.push(`sort=${sortFilter}`);
    if (paramToRemove !== 'search' && searchQuery) queryParts.push(`search=${encodeURIComponent(searchQuery)}`);
    
    return queryParts.length > 0 ? `/catalogo?${queryParts.join('&')}` : '/catalogo';
  };

  // Helper to build URL removing just ONE category from the selected list
  const getCategoryBadgeLink = (catName: string) => {
    const remainingCats = selectedCategories.filter(c => c.toLowerCase() !== catName.toLowerCase());
    const nextCatQuery = remainingCats.length > 0 ? `categoria=${encodeURIComponent(remainingCats.join(','))}` : '';
    
    const queryParts = [];
    if (nextCatQuery) queryParts.push(nextCatQuery);
    if (collectionId) queryParts.push(`coleccion=${collectionId}`);
    if (sizeFilter) queryParts.push(`talla=${sizeFilter}`);
    if (colorFilter) queryParts.push(`color=${encodeURIComponent(colorFilter)}`);
    if (params.maxPrice) queryParts.push(`maxPrice=${params.maxPrice}`);
    if (sortFilter !== 'tendencias') queryParts.push(`sort=${sortFilter}`);
    if (searchQuery) queryParts.push(`search=${encodeURIComponent(searchQuery)}`);
    
    return queryParts.length > 0 ? `/catalogo?${queryParts.join('&')}` : '/catalogo';
  };

  const hasActiveFilters = collectionId || selectedCategories.length > 0 || sizeFilter || colorFilter || (params.maxPrice && parseFloat(params.maxPrice) < maxAvailablePrice) || searchQuery;

  // Build a nice heading title depending on active selections
  const getPageHeading = () => {
    if (collectionName) return `Colección: ${collectionName}`;
    if (selectedCategories.length === 1) return `Catálogo: ${selectedCategories[0]}`;
    if (selectedCategories.length > 1) return `Catálogo de Moda`;
    return 'Catálogo Digital';
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] py-8">
      {/* Container stretches 100% width with px-6 md:px-12 padding for a clean, spacious interface */}
      <main className="max-w-full mx-auto px-6 md:px-12 py-12 flex flex-col md:flex-row gap-12">
        
        {/* Dynamic & Mobile Responsive Sidebar Filters */}
        <CatalogFilters 
          categories={categories}
          sizes={sizes}
          colors={colors}
          minPrice={minAvailablePrice}
          maxPrice={maxAvailablePrice}
        />

        {/* Product Grid and Results Section */}
        <div className="flex-1">
          <div className="flex justify-between items-end mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-serif text-gray-900 mb-1">
                {getPageHeading()}
              </h1>
              <p className="text-sm text-gray-500">
                {displayProducts.length} {displayProducts.length === 1 ? 'diseño exclusivo' : 'diseños exclusivos'}
              </p>
            </div>
            
            {/* Sorting Select Component */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Ordenar por:</span>
              <SortSelector />
            </div>
          </div>

          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div className="mb-8 flex flex-wrap gap-2 items-center animate-enter">
              <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Filtros Activos:</span>
              
              {collectionId && (
                <span className="inline-flex items-center gap-2 bg-[#FBEFEF] text-[#8B5A5A] px-4 py-1.5 rounded-full text-xs font-bold border border-[#8B5A5A]/10 shadow-sm">
                  Colección: {collectionName}
                  <Link href={getBadgeLink('coleccion')} className="hover:bg-red-200 hover:text-red-800 bg-white/50 text-[#8B5A5A] w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black transition-colors">&times;</Link>
                </span>
              )}

              {/* Render a separate badge for EACH selected category */}
              {selectedCategories.map((catName) => (
                <span key={catName} className="inline-flex items-center gap-2 bg-[#FBEFEF] text-[#8B5A5A] px-4 py-1.5 rounded-full text-xs font-bold border border-[#8B5A5A]/10 shadow-sm">
                  Catálogo: {catName}
                  <Link href={getCategoryBadgeLink(catName)} className="hover:bg-red-200 hover:text-red-800 bg-white/50 text-[#8B5A5A] w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black transition-colors">&times;</Link>
                </span>
              ))}

              {sizeFilter && (
                <span className="inline-flex items-center gap-2 bg-[#FBEFEF] text-[#8B5A5A] px-4 py-1.5 rounded-full text-xs font-bold border border-[#8B5A5A]/10 shadow-sm">
                  Talla: {sizeFilter}
                  <Link href={getBadgeLink('talla')} className="hover:bg-red-200 hover:text-red-800 bg-white/50 text-[#8B5A5A] w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black transition-colors">&times;</Link>
                </span>
              )}
              {colorFilter && (
                <span className="inline-flex items-center gap-2 bg-[#FBEFEF] text-[#8B5A5A] px-4 py-1.5 rounded-full text-xs font-bold border border-[#8B5A5A]/10 shadow-sm">
                  Color: {colorFilter}
                  <Link href={getBadgeLink('color')} className="hover:bg-red-200 hover:text-red-800 bg-white/50 text-[#8B5A5A] w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black transition-colors">&times;</Link>
                </span>
              )}
              {params.maxPrice && parseFloat(params.maxPrice) < maxAvailablePrice && (
                <span className="inline-flex items-center gap-2 bg-[#FBEFEF] text-[#8B5A5A] px-4 py-1.5 rounded-full text-xs font-bold border border-[#8B5A5A]/10 shadow-sm">
                  Precio máx: S/ {params.maxPrice}
                  <Link href={getBadgeLink('maxPrice')} className="hover:bg-red-200 hover:text-red-800 bg-white/50 text-[#8B5A5A] w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black transition-colors">&times;</Link>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-2 bg-[#FBEFEF] text-[#8B5A5A] px-4 py-1.5 rounded-full text-xs font-bold border border-[#8B5A5A]/10 shadow-sm">
                  Búsqueda: &quot;{searchQuery}&quot;
                  <Link href={getBadgeLink('search')} className="hover:bg-red-200 hover:text-red-800 bg-white/50 text-[#8B5A5A] w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black transition-colors">&times;</Link>
                </span>
              )}
            </div>
          )}

          {/* Product Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12">
            {displayProducts.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
                <p className="text-gray-500 font-serif text-lg">No hay productos disponibles con estos filtros.</p>
                <p className="text-xs text-gray-400 mt-2">Prueba quitando algunos filtros o limpiando la búsqueda.</p>
                <Link href="/catalogo" className="inline-block mt-6 bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white px-6 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-colors shadow-sm">
                  Ver todo el catálogo
                </Link>
              </div>
            ) : (
              displayProducts.map((p) => (
                <div key={p.id} className="group cursor-pointer animate-enter">
                  <Link href={`/producto/${p.slug}`}>
                    <div className="relative aspect-[3/4] bg-gray-100 mb-4 overflow-hidden rounded-[2rem] border border-gray-100">
                      <img 
                        src={p.images?.[0]?.url || 'https://via.placeholder.com/600x800'} 
                        alt={p.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
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

          {displayProducts.length > 0 && (
            <div className="mt-16 flex justify-center items-center gap-4 border-t border-gray-100 pt-8">
              <button className="w-10 h-10 flex items-center justify-center border border-gray-100 rounded-xl text-gray-500 hover:text-black transition-colors" disabled>&lt;</button>
              <span className="text-xs font-bold tracking-widest text-gray-900">PÁGINA 1 DE 1</span>
              <button className="w-10 h-10 flex items-center justify-center border border-gray-100 rounded-xl text-gray-500 hover:text-black transition-colors" disabled>&gt;</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
