'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Truck, Recycle, ShoppingBag, Check } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

export default function ProductoPageClient({ product }: { product: any }) {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'es';
  const { addItem } = useCartStore();

  const currentProduct = product;
  const parsedPrice = typeof currentProduct?.price === 'number' ? currentProduct.price : parseFloat(currentProduct?.price || '0');

  const reviews = currentProduct?.reviews || [];
  const relatedProducts = currentProduct?.relatedProducts || [];
  const reviewCount = reviews.length;
  const rating = reviewCount > 0
    ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount
    : 0;

  const productImages = currentProduct?.images || [];
  const mainImageUrl = productImages.length > 0
    ? (productImages.find((img: any) => img.isMain)?.url || productImages[0].url)
    : '';

  const galleryImages = productImages.map((img: any) => img.url);

  const [activeImage, setActiveImage] = useState(mainImageUrl);

  useEffect(() => {
    setActiveImage(mainImageUrl);
  }, [mainImageUrl]);

  const descriptionText = currentProduct?.description || '';

  // Las tallas y colores salen de las variantes reales del producto; si el
  // producto no tiene variantes, se usan sus tags. Nunca se inventan opciones
  // que la tienda no vende.
  const dbVariants = currentProduct?.variants || [];

  const { sizes, colors } = useMemo(() => {
    let extractedSizes = Array.from(new Set(dbVariants.map((v: any) => v.size).filter(Boolean))) as string[];
    if (extractedSizes.length === 0) {
      extractedSizes = (currentProduct?.tags || [])
        .filter((t: string) => t.startsWith('size:'))
        .map((t: string) => t.replace('size:', ''));
    }

    let extractedColors = Array.from(
      new Map(
        dbVariants
          .filter((v: any) => v.color)
          .map((v: any) => [v.color, { name: v.color, hex: v.colorHex || '#000000' }])
      ).values()
    ) as { name: string; hex: string }[];

    if (extractedColors.length === 0) {
      extractedColors = (currentProduct?.tags || [])
        .filter((t: string) => t.startsWith('color:'))
        .map((t: string) => {
          const parts = t.replace('color:', '').split(':');
          return { name: parts[0], hex: parts[1] || '#000000' };
        });
    }

    return { sizes: extractedSizes, colors: extractedColors };
  }, [dbVariants, currentProduct?.tags]);

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (sizes.length > 0 && !selectedSize) {
      setSelectedSize(sizes[0]);
    }
    if (colors.length > 0 && !selectedColor) {
      setSelectedColor(colors[0].name);
    }
  }, [sizes, colors, selectedSize, selectedColor]);

  // Find active variant matching selectedSize & selectedColor
  const activeVariant = useMemo(() => {
    if (dbVariants.length === 0) return null;
    return dbVariants.find((v: any) => {
      const sizeMatch = !v.size || v.size === selectedSize;
      const colorMatch = !v.color || v.color === selectedColor;
      return sizeMatch && colorMatch;
    });
  }, [dbVariants, selectedSize, selectedColor]);

  const stockAvailable = activeVariant ? activeVariant.stock : (currentProduct.stock || 10);
  const isOutOfStock = dbVariants.length > 0 && (!activeVariant || activeVariant.stock <= 0);

  const isSizeOutOfStock = (size: string) => {
    if (dbVariants.length === 0) return false;
    const variantForSize = dbVariants.find((v: any) => {
      const colorMatch = !v.color || v.color === selectedColor;
      return v.size === size && colorMatch;
    });
    return !variantForSize || variantForSize.stock <= 0;
  };

  const isColorOutOfStock = (colorName: string) => {
    if (dbVariants.length === 0) return false;
    const variantForColor = dbVariants.find((v: any) => {
      const sizeMatch = !v.size || v.size === selectedSize;
      return v.color === colorName && sizeMatch;
    });
    return !variantForColor || variantForColor.stock <= 0;
  };

  const handleAddToCart = () => {
    addItem({
      id: currentProduct.id,
      name: currentProduct.name,
      price: parsedPrice,
      quantity: 1,
      imageUrl: mainImageUrl,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      variantId: activeVariant?.id,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addItem({
      id: currentProduct.id,
      name: currentProduct.name,
      price: parsedPrice,
      quantity: 1,
      imageUrl: mainImageUrl,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      variantId: activeVariant?.id,
    });
    router.push(`/${locale}/checkout`);
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <main className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-12 mb-24">

          {/* Columna Izquierda: Galería */}
          <div className="flex-[3] flex gap-4">
            <div className="w-24 flex flex-col gap-4">
              {galleryImages.map((imgUrl: string, idx: number) => (
                <div 
                  key={idx}
                  onClick={() => setActiveImage(imgUrl)}
                  className={`w-24 aspect-[3/4] bg-gray-200 border-2 overflow-hidden cursor-pointer transition-all ${
                    activeImage === imgUrl ? 'border-[#6B5A51] opacity-100' : 'border-transparent opacity-70 hover:opacity-100 hover:border-gray-300'
                  }`}
                >
                  <img src={imgUrl} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="flex-1 relative bg-gray-100 rounded-none overflow-hidden aspect-[3/4]">
              <img src={activeImage} className="w-full h-full object-cover animate-fade-in" />
              <button className="absolute top-6 right-6 w-10 h-10 bg-white/80 backdrop-blur-md rounded-lg flex items-center justify-center text-gray-700 hover:text-black transition-colors">
                <Search size={20} />
              </button>
            </div>
          </div>

          {/* Columna Derecha: Info Producto */}
          <div className="flex-[2] py-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-4">
              <Link href={`/${locale}`} className="hover:text-black">Inicio</Link>
              <span>/</span>
              <Link href={`/${locale}/colecciones`} className="hover:text-black">Colecciones</Link>
              <span>/</span>
              <span className="text-gray-900">{currentProduct.category?.name}</span>
            </div>

            <h1 className="text-3xl font-serif text-gray-900 mb-2">{currentProduct.name}</h1>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-2xl font-bold text-gray-900">S/ {parsedPrice.toFixed(2)}</span>
              {reviewCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="text-yellow-500 text-sm">{'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}</span>
                  <span>({reviewCount} {reviewCount === 1 ? 'reseña' : 'reseñas'})</span>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 leading-relaxed mb-8">{descriptionText}</p>

            {/* Color */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-900 tracking-widest uppercase mb-3">
                COLOR: <span className="font-normal text-gray-500 normal-case ml-1">{selectedColor}</span>
              </h3>
              <div className="flex gap-3">
                {colors.map((color) => {
                  const colorOutOfStock = isColorOutOfStock(color.name);
                  return (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      title={color.name + (colorOutOfStock ? ' (Agotado)' : '')}
                      className={`w-8 h-8 rounded-full border-2 transition-all relative ${
                        selectedColor === color.name 
                          ? 'border-[#6B5A51] ring-2 ring-offset-2 ring-[#6B5A51]' 
                          : 'border-gray-200 hover:border-gray-400'
                      } ${colorOutOfStock ? 'opacity-40' : ''}`}
                      style={{ backgroundColor: color.hex }}
                    >
                      {colorOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-0.5 bg-red-600 rotate-45"></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Talla */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-gray-900 tracking-widest uppercase">TALLA:</h3>
                <Link href="#" className="text-xs text-gray-500 underline hover:text-black">Guía de tallas</Link>
              </div>
              <div className="flex gap-2">
                {sizes.map((size) => {
                  const sizeOutOfStock = isSizeOutOfStock(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-10 text-xs font-bold transition-colors border ${
                        selectedSize === size
                          ? 'bg-black text-white border-black'
                          : sizeOutOfStock
                          ? 'border-gray-200 text-gray-300 line-through cursor-not-allowed bg-gray-50'
                          : 'border-gray-300 text-gray-600 hover:border-gray-900'
                      }`}
                      disabled={sizeOutOfStock}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={`flex items-center gap-2 mb-8 text-xs font-bold ${isOutOfStock ? 'text-red-600' : 'text-gray-900'}`}>
              <span className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-red-600' : 'bg-black'}`}></span>
              {isOutOfStock 
                ? 'Agotado para la combinación seleccionada' 
                : stockAvailable <= 5 
                ? `¡Solo quedan ${stockAvailable} unidades!` 
                : `Disponible (${stockAvailable} unidades)`}
            </div>

            {/* Botones de Acción */}
            <div className="space-y-3 mb-8">
              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="w-full bg-black hover:bg-gray-800 text-white py-4 font-bold tracking-widest uppercase transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOutOfStock ? 'Agotado' : 'Comprar Ahora →'}
              </button>
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`w-full py-4 font-bold tracking-widest uppercase transition-all flex justify-center items-center gap-2 ${
                  added
                    ? 'bg-green-600 text-white border border-green-600'
                    : 'bg-white border border-black hover:bg-gray-50 text-black'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isOutOfStock ? (
                  'Agotado'
                ) : added ? (
                  <><Check size={18} /> ¡Añadido a la Bolsa!</>
                ) : (
                  <><ShoppingBag size={18} /> Añadir a la Bolsa</>
                )}
              </button>
            </div>

            <div className="flex items-center gap-8 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <Truck size={24} className="text-gray-400" />
                <div>
                  <p className="text-xs font-bold text-gray-900">Envío a Todo el País</p>
                  <p className="text-[10px] text-gray-500">Lima 2-3 días · Provincias 5-7 días</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Recycle size={24} className="text-gray-400" />
                <div>
                  <p className="text-xs font-bold text-gray-900">Sostenible</p>
                  <p className="text-[10px] text-gray-500">Packaging Eco-Friendly</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reseñas — sólo se muestran si existen reseñas reales del producto */}
        {reviews.length > 0 && (
          <div className="mb-24">
            <div className="mb-8 border-b border-gray-200 pb-4">
              <h2 className="text-2xl font-serif text-gray-900">Reseñas</h2>
              <p className="text-sm text-gray-500 mt-1">Lo que opinan quienes ya compraron esta prenda.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((review: any) => {
                const author = [review.user?.firstName, review.user?.lastName].filter(Boolean).join(' ') || 'Clienta Phalay';
                const initials = author.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <div key={review.id} className="bg-white border border-gray-100 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-700">{initials}</div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{author}</p>
                          {review.verified && (
                            <p className="text-[10px] text-gray-400">Compra verificada</p>
                          )}
                        </div>
                      </div>
                      <span className="text-yellow-500 text-xs">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 italic leading-relaxed">"{review.comment}"</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completa el Look — productos reales relacionados */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-serif text-gray-900 mb-8">Completa el Look</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((p: any) => (
                <Link href={`/${locale}/producto/${p.slug}`} key={p.id} className="group cursor-pointer">
                  <div className="relative aspect-[3/4] bg-gray-100 mb-4 overflow-hidden">
                    {p.images?.[0]?.url && (
                      <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-gray-900 mb-1">{p.name}</h3>
                  <span className="text-xs font-bold text-gray-600">S/ {Number(p.price).toFixed(2)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
