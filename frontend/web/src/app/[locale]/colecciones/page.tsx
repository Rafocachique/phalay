import Link from 'next/link';

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

export default async function ColeccionesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const colecciones = await getCollections();

  return (
    <div className="bg-[#F8F8F8] py-12 md:py-20 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-serif text-[#4A3E38] mb-4">Nuestras Colecciones</h1>
          <p className="text-gray-600 font-medium max-w-xl mx-auto">
            Explora selecciones exclusivas curadas meticulosamente por nuestros diseñadores para acompañarte en cada momento importante de tu vida.
          </p>
        </div>

        {colecciones.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-500">Aún no hay colecciones disponibles.</h2>
            <p className="text-gray-400 mt-2">Estamos preparando nuestras próximas piezas exclusivas.</p>
          </div>
        ) : colecciones.length === 1 ? (
          // DENSITY ADJUST: Single centered card
          <div className="max-w-md md:max-w-lg mx-auto w-full">
            <Link 
              href={`/${locale}/catalogo?coleccion=${colecciones[0].id}`}
              className="group bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full transform hover:-translate-y-2"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                <img 
                  src={colecciones[0].imageUrl || 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800&q=80'} 
                  alt={colecciones[0].name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1000ms] ease-out" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-85 group-hover:opacity-90 transition-opacity duration-300"></div>
                
                <span className="absolute top-6 left-6 px-4 py-1.5 bg-white/95 backdrop-blur-md text-[#8B5A5A] text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
                  Colección Exclusiva
                </span>
              </div>
              
              <div className="p-8 flex flex-col flex-1 justify-between bg-white relative">
                <div>
                  <h2 className="text-2xl font-serif text-gray-900 mb-3 group-hover:text-[#8B5A5A] transition-colors duration-300">
                    {colecciones[0].name}
                  </h2>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3">
                    {colecciones[0].description || 'Descubre piezas únicas para momentos inolvidables.'}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900 group-hover:gap-4 transition-all duration-300">
                  <span className="border-b-2 border-[#8B5A5A] pb-0.5">Explorar Colección</span>
                  <span className="text-[#8B5A5A] text-lg">→</span>
                </div>
              </div>
            </Link>
          </div>
        ) : colecciones.length === 2 ? (
          // DENSITY ADJUST: Two centered cards side-by-side
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {colecciones.map((col: any) => (
              <Link 
                key={col.id} 
                href={`/${locale}/catalogo?coleccion=${col.id}`}
                className="group bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full transform hover:-translate-y-2"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                  <img 
                    src={col.imageUrl || 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800&q=80'} 
                    alt={col.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1000ms] ease-out" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-85 group-hover:opacity-90 transition-opacity duration-300"></div>
                  
                  <span className="absolute top-6 left-6 px-4 py-1.5 bg-white/95 backdrop-blur-md text-[#8B5A5A] text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
                    Colección Exclusiva
                  </span>
                </div>
                
                <div className="p-8 flex flex-col flex-1 justify-between bg-white relative">
                  <div>
                    <h2 className="text-2xl font-serif text-gray-900 mb-3 group-hover:text-[#8B5A5A] transition-colors duration-300">
                      {col.name}
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3">
                      {col.description || 'Descubre piezas únicas para momentos inolvidables.'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-900 group-hover:gap-4 transition-all duration-300">
                    <span className="border-b-2 border-[#8B5A5A] pb-0.5">Explorar Colección</span>
                    <span className="text-[#8B5A5A] text-lg">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          // DENSITY ADJUST: Standard grid layout for 3 or more collections
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {colecciones.map((col: any) => (
              <Link 
                key={col.id} 
                href={`/${locale}/catalogo?coleccion=${col.id}`}
                className="group bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full transform hover:-translate-y-2"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                  <img 
                    src={col.imageUrl || 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800&q=80'} 
                    alt={col.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1000ms] ease-out" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-85 group-hover:opacity-90 transition-opacity duration-300"></div>
                  
                  <span className="absolute top-6 left-6 px-4 py-1.5 bg-white/95 backdrop-blur-md text-[#8B5A5A] text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
                    Colección Exclusiva
                  </span>
                </div>
                
                <div className="p-8 flex flex-col flex-1 justify-between bg-white relative">
                  <div>
                    <h2 className="text-2xl font-serif text-gray-900 mb-3 group-hover:text-[#8B5A5A] transition-colors duration-300">
                      {col.name}
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3">
                      {col.description || 'Descubre piezas únicas para momentos inolvidables.'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-900 group-hover:gap-4 transition-all duration-300">
                    <span className="border-b-2 border-[#8B5A5A] pb-0.5">Explorar Colección</span>
                    <span className="text-[#8B5A5A] text-lg">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
