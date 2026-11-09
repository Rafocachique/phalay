'use client';

import { createProduct } from '@/app/actions/products';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';
import { ChevronLeft, Save, Plus, Trash2, Info, RefreshCw } from 'lucide-react';

type ColorItem = { name: string; hex: string };
type VariantStock = Record<string, number | ''>; // key = "size:color"

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2', '4', '6', '8', '10', '12', '14'];
const MAX_IMAGES = 12;
const AUDIENCES = ['Mujer', 'Hombre', 'Niña', 'Niño', 'Unisex', 'Familiar'];

export default function NuevoProductoPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>(['']);

  // Inventario base (sincroniza todos al cambiar)

  // Variantes state
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['S', 'M']);
  const [selectedColors, setSelectedColors] = useState<ColorItem[]>([
    { name: 'Rosa Pastel', hex: '#E8B4B8' },
    { name: 'Marfil', hex: '#FFFFFF' },
    { name: 'Negro', hex: '#111111' },
  ]);

  // Stock por variante: key "S:Rosa Pastel" -> stock number
  const [variantStocks, setVariantStocks] = useState<VariantStock>({});
  const [newSize, setNewSize] = useState('');
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>(['Mujer']);

  // Add custom color
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#8B5A5A');

  // Categories and Collections
  const [categories, setCategories] = useState<any[]>([]);
  const [collectionsList, setCollectionsList] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);

  const [catalogFailed, setCatalogFailed] = useState(false);

  useEffect(() => {
    // Se pide a nuestra propia ruta (mismo origen) en vez de a la API directa:
    // desde el navegador la API bloquea el origen por CORS en producción.
    fetch('/api/catalog-options', { cache: 'no-store' })
      .then(async res => {
        const data = await res.json();
        setCategories(data.categories || []);
        setCollectionsList(data.collections || []);
        setCatalogFailed(!res.ok || !!data.failed);
        if (data.categories?.length > 0) setSelectedCategoryId(data.categories[0].id);
      })
      .catch(() => setCatalogFailed(true));
  }, []);

  // Get all variant combinations
  const getVariantCombinations = useCallback(() => {
    const combos: { size: string; color: ColorItem }[] = [];
    for (const size of selectedSizes) {
      for (const color of selectedColors) {
        combos.push({ size, color });
      }
    }
    return combos;
  }, [selectedSizes, selectedColors]);

  // Get stock for a specific variant
  const getVariantStock = (size: string, colorName: string) => {
    const key = `${size}:${colorName}`;
    return variantStocks[key] !== undefined ? variantStocks[key] : 0;
  };

  // Set stock for a specific variant
  const setVariantStock = (size: string, colorName: string, value: number | '') => {
    const key = `${size}:${colorName}`;
    setVariantStocks(prev => ({ ...prev, [key]: value }));
  };

  // Total stock to show
  const totalStock = getVariantCombinations().reduce((sum, { size, color }) => {
    return sum + Number(getVariantStock(size, color.name) || 0);
  }, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (selectedSizes.length === 0) {
      toast.error('Selecciona al menos una talla.');
      return;
    }
    if (selectedColors.length === 0) {
      toast.error('Agrega al menos un color.');
      return;
    }

    setSubmitting(true);
    const urls = images.filter(Boolean);
    formData.set('images', JSON.stringify(urls));

    // Tags for sizes and colors
    const tags = [
      ...selectedSizes.map(s => `size:${s}`),
      ...selectedColors.map(c => `color:${c.name}:${c.hex}`),
      ...selectedAudiences.map(audience => `audience:${audience}`),
    ];
    formData.set('tags', JSON.stringify(tags));

    // Build variants payload with individual stocks
    const variants = getVariantCombinations().map(({ size, color }) => ({
      size,
      color: color.name,
      colorHex: color.hex,
      stock: Number(getVariantStock(size, color.name) || 0),
    }));
    formData.set('variants', JSON.stringify(variants));
    formData.set('stock', String(totalStock));
    formData.set('categoryId', selectedCategoryId);
    formData.set('collectionIds', JSON.stringify(selectedCollectionIds));

    const result = await createProduct(formData);
    setSubmitting(false);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success('Producto creado y publicado con éxito');
      router.push('/productos');
      router.refresh();
    }
  }

  const combinations = getVariantCombinations();

  return (
    <div className="animate-enter w-full pb-12">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/productos" className="hover:text-gray-900 flex items-center gap-1 font-medium">
                <ChevronLeft size={14} /> Productos
              </Link>
              <span>/</span>
              <span className="font-semibold text-gray-800">Nuevo Producto</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Publicar Nuevo Producto</h1>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50"
          >
            <Save size={18} />
            {submitting ? 'Publicando...' : 'Publicar Producto'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column */}
          <div className="flex-[3] space-y-6">

            {/* Información General */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-xl font-bold text-gray-900 border-b border-gray-50 pb-3">Información General</h2>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Nombre del Producto</label>
                <input type="text" name="name" required placeholder="Ej. Vestido Seda 'Amanecer'"
                  className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Descripción Detallada</label>
                <div className="bg-[#F8F9FA] border border-transparent focus-within:bg-white focus-within:border-[#8B5A5A] rounded-xl overflow-hidden transition-all">
                  <textarea name="description" required rows={6}
                    placeholder="Describe los detalles de confección, corte, caída y sensaciones de la prenda..."
                    className="w-full bg-transparent border-none p-4 outline-none text-gray-900 resize-none text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Precio (S/)</label>
                  <div className="flex items-center bg-[#F8F9FA] rounded-xl px-4 py-3.5 focus-within:bg-white focus-within:ring-1 focus-within:ring-[#8B5A5A] transition-all">
                    <span className="text-gray-400 mr-2 font-semibold">S/</span>
                    <input type="number" name="price" step="0.01" required placeholder="0.00"
                      className="w-full bg-transparent border-none outline-none text-gray-900 font-bold" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">SKU / Código Único</label>
                  <input type="text" name="sku" required defaultValue={`PH-${Math.floor(1000 + Math.random() * 9000)}`}
                    className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 font-mono transition-colors" />
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#8B5A5A]/20 bg-[#FBEFEF]/60 p-4 transition-colors hover:bg-[#FBEFEF]">
                <input name="featured" type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300 text-[#8B5A5A] focus:ring-[#8B5A5A]" />
                <span>
                  <span className="block text-sm font-bold text-gray-900">Mostrar en Nueva colección</span>
                  <span className="mt-1 block text-xs text-gray-500">Aparecerá en la selección principal de la tienda. Puedes destacar hasta 8 productos.</span>
                </span>
              </label>
            </div>

            {/* Tallas y Colores */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 space-y-8">
              <h2 className="text-xl font-bold text-gray-900 border-b border-gray-50 pb-3">Tallas y Colores</h2>

              {/* Tallas */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-gray-900">Tallas Disponibles</h3>
                  <span className="text-xs text-gray-400">Clic para activar/desactivar</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SIZES.map((talla) => {
                    const isSelected = selectedSizes.includes(talla);
                    return (
                      <button key={talla} type="button"
                        onClick={() => setSelectedSizes(isSelected ? selectedSizes.filter(s => s !== talla) : [...selectedSizes, talla])}
                        className={`w-12 h-10 rounded-xl font-bold text-sm border transition-all flex items-center justify-center ${isSelected ? 'bg-[#FBEFEF] text-[#8B5A5A] border-[#8B5A5A] scale-105 shadow-sm' : 'bg-white text-gray-400 border-gray-200 hover:border-[#8B5A5A]/50'}`}>
                        {talla}
                      </button>
                    );
                  })}
                  {selectedSizes.filter((size) => !COMMON_SIZES.includes(size)).map((size) => (
                    <button key={size} type="button" onClick={() => setSelectedSizes((current) => current.filter((value) => value !== size))} className="h-10 rounded-xl font-bold text-sm border bg-[#FBEFEF] text-[#8B5A5A] border-[#8B5A5A] px-3 transition-all flex items-center gap-2" title="Quitar talla personalizada">
                      {size} <Trash2 size={13} />
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newSize}
                    onChange={(event) => setNewSize(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') { event.preventDefault(); }
                    }}
                    placeholder="Talla personalizada: Ej. Niño 3, 16, Dama única"
                    className="flex-1 bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900"
                  />
                  <button type="button" onClick={() => {
                    const size = newSize.trim();
                    if (!size) return;
                    if (selectedSizes.some((current) => current.toLowerCase() === size.toLowerCase())) {
                      toast.error('Esa talla ya está agregada.');
                      return;
                    }
                    setSelectedSizes((current) => [...current, size]);
                    setNewSize('');
                  }} className="bg-[#8B5A5A]/10 hover:bg-[#8B5A5A]/20 text-[#8B5A5A] px-5 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-1">
                    <Plus size={15} /> Agregar talla
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">Puedes usar tallas de niño, números o nombres propios. Para un pack familiar, la clienta agrega cada talla elegida a la bolsa por separado.</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3"><h3 className="text-sm font-bold text-gray-900">¿Para quién es esta prenda?</h3><span className="text-xs text-gray-400">Puedes elegir más de uno para packs</span></div>
                <div className="flex flex-wrap gap-2">
                  {AUDIENCES.map((audience) => {
                    const selected = selectedAudiences.includes(audience);
                    return <button key={audience} type="button" onClick={() => setSelectedAudiences((current) => selected ? current.filter((value) => value !== audience) : [...current, audience])} className={`h-10 rounded-xl px-4 font-bold text-sm border transition-all ${selected ? 'bg-[#FBEFEF] text-[#8B5A5A] border-[#8B5A5A]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#8B5A5A]/50'}`}>{audience}</button>;
                  })}
                </div>
              </div>

              {/* Colores */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-gray-900">Colores / Tonalidades</h3>
                  <span className="text-xs text-gray-400">Colores activos</span>
                </div>

                <div className="flex flex-wrap gap-3 items-center mb-4">
                  {selectedColors.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No hay colores. Agrega uno abajo.</p>
                  ) : (
                    selectedColors.map((color, index) => (
                      <div key={index} className="flex items-center gap-2 bg-[#F8F9FA] px-3.5 py-2 rounded-full border border-gray-100 group shadow-sm">
                        <div className="w-4 h-4 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: color.hex }} />
                        <span className="text-xs font-semibold text-gray-700">{color.name}</span>
                        <button type="button"
                          onClick={() => setSelectedColors(selectedColors.filter((_, idx) => idx !== index))}
                          className="text-gray-400 hover:text-red-500 transition-colors p-0.5">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nombre del Color</label>
                    <input type="text" placeholder="Ej. Verde Oliva, Rosa Pastel" value={newColorName}
                      onChange={e => setNewColorName(e.target.value)}
                      className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-2.5 text-xs focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 transition-colors" />
                  </div>
                  <div className="w-24">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Color</label>
                    <div className="flex items-center bg-[#F8F9FA] rounded-xl px-3 py-1.5 border border-transparent h-[38px] w-full">
                      <input type="color" value={newColorHex} onChange={e => setNewColorHex(e.target.value)}
                        className="w-full h-6 border-none bg-transparent cursor-pointer rounded outline-none" />
                    </div>
                  </div>
                  <button type="button"
                    onClick={() => {
                      if (!newColorName.trim()) { toast.error('Escribe un nombre para el color.'); return; }
                      setSelectedColors([...selectedColors, { name: newColorName.trim(), hex: newColorHex }]);
                      setNewColorName('');
                    }}
                    className="bg-[#8B5A5A]/10 hover:bg-[#8B5A5A]/20 text-[#8B5A5A] px-5 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1 h-[38px] cursor-pointer">
                    <Plus size={14} /> Agregar
                  </button>
                </div>
              </div>
            </div>

            {/* Control de Stock */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Control de Stock por Variante</h2>
                  <p className="text-xs text-gray-400 mt-1">Define el stock disponible para cada combinación de talla y color.</p>
                </div>
                {/* Total badge */}
                <div className="text-right">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total en inventario</p>
                  <p className={`text-2xl font-black ${totalStock === 0 ? 'text-red-500' : 'text-gray-900'}`}>{totalStock} unid.</p>
                </div>
              </div>

              <div className="bg-[#FBF5F5] rounded-2xl p-4 flex items-center gap-4 border border-[#8B5A5A]/10">
                <Info size={18} className="text-[#8B5A5A] flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">El stock total se calcula automáticamente</p>
                  <p className="text-xs text-gray-500 mt-0.5">Ingresa el inventario de cada combinación de color y talla a continuación y el total se actualizará solo.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" title="Limpiar todas las variantes a 0"
                    onClick={() => {
                      const zeros: VariantStock = {};
                      combinations.forEach(({ size, color }) => { zeros[`${size}:${color.name}`] = 0; });
                      setVariantStocks(zeros);
                    }}
                    className="p-2 rounded-xl bg-[#8B5A5A]/10 hover:bg-[#8B5A5A]/20 text-[#8B5A5A] transition-colors font-bold text-xs flex items-center gap-1">
                    <RefreshCw size={14} /> Poner en 0
                  </button>
                </div>
              </div>

              {/* Variant stock table */}
              {combinations.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Selecciona tallas y colores arriba para ver las combinaciones de stock.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-3 font-bold text-[11px] text-gray-400 uppercase tracking-wider">Talla</th>
                        <th className="pb-3 font-bold text-[11px] text-gray-400 uppercase tracking-wider">Color</th>
                        <th className="pb-3 font-bold text-[11px] text-gray-400 uppercase tracking-wider text-right">Stock Disponible</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {combinations.map(({ size, color }) => {
                        const key = `${size}:${color.name}`;
                        const isOverridden = variantStocks[key] !== undefined;
                        const stockVal = getVariantStock(size, color.name);
                        return (
                          <tr key={key} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3">
                              <span className="font-black text-gray-900 text-sm">{size}</span>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full border border-gray-200 shadow-sm flex-shrink-0"
                                  style={{ backgroundColor: color.hex }} />
                                <span className="text-sm text-gray-700 font-medium">{color.name}</span>
                                {isOverridden && (
                                  <span className="text-[10px] bg-[#8B5A5A]/10 text-[#8B5A5A] font-bold px-1.5 py-0.5 rounded">editado</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              <input
                                type="number"
                                min="0"
                                value={stockVal}
                                onChange={e => setVariantStock(
                                  size,
                                  color.name,
                                  e.target.value === '' ? '' : Math.max(0, Number(e.target.value)),
                                )}
                                className={`w-24 text-center rounded-xl px-3 py-2 font-bold text-sm outline-none border transition-colors ${isOverridden ? 'bg-[#FBEFEF] border-[#8B5A5A]/40 text-[#8B5A5A]' : 'bg-[#F8F9FA] border-transparent text-gray-900 focus:bg-white focus:border-[#8B5A5A]'}`}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Tipo de Prenda y Colecciones */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-xl font-bold text-gray-900 border-b border-gray-50 pb-3">Tipo de Prenda y Colecciones</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Tipo de Prenda</label>
                  {categories.length === 0 ? (
                    <div className={`w-full rounded-xl p-4 text-xs ${catalogFailed ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-[#F8F9FA] text-gray-500 italic'}`}>
                      {catalogFailed
                        ? 'No pudimos cargar los tipos de prenda. Revisa que el servidor esté disponible y recarga la página.'
                        : 'Aún no hay tipos de prenda. Créalos en la sección Catálogo.'}
                    </div>
                  ) : (
                    <select name="categoryId" value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)}
                      className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 font-bold transition-colors cursor-pointer text-sm">
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Colecciones del Producto</label>
                  {collectionsList.length === 0 ? (
                    <p className={`text-xs rounded-xl p-4 ${catalogFailed ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-[#F8F9FA] text-gray-500 italic'}`}>
                      {catalogFailed
                        ? 'No pudimos cargar las colecciones. Revisa que el servidor esté disponible y recarga la página.'
                        : 'Aún no hay colecciones. Créalas en la sección Colecciones.'}
                    </p>
                  ) : (
                    <>
                    <div className="grid grid-cols-1 gap-2 rounded-xl border border-gray-100 bg-[#F8F9FA] p-3">
                      {collectionsList.map((col) => {
                        const selected = selectedCollectionIds.includes(col.id);
                        return (
                          <label key={col.id} className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${selected ? 'bg-white text-[#8B5A5A] shadow-sm' : 'text-gray-600 hover:bg-white/70'}`}>
                            <input type="checkbox" checked={selected} onChange={() => setSelectedCollectionIds((current) => selected ? current.filter((id) => id !== col.id) : [...current, col.id])} className="h-4 w-4 rounded border-gray-300 text-[#8B5A5A] focus:ring-[#8B5A5A]" />
                            {col.name}
                          </label>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Puedes asociar esta prenda a una o varias colecciones.</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Images */}
          <div className="flex-[2] space-y-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Galería del Producto</h2>
                <p className="text-xs text-gray-400 mt-1">Sube fotos reales de tus prendas. JPG, PNG y WebP.</p>
              </div>
              <div className="space-y-4">
                {images.map((image, index) => (
                  <div key={index} className="relative p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <ImageUpload
                      name={`image_${index + 1}`}
                      label={index === 0 ? 'Imagen principal (catálogo)' : `Imagen detalle ${index}`}
                      currentUrl={image}
                      onUrlChange={(url) => setImages((current) => current.map((value, currentIndex) => currentIndex === index ? url : value))}
                    />
                    {images.length > 1 && (
                      <button type="button" onClick={() => setImages((current) => current.filter((_, currentIndex) => currentIndex !== index))} className="mt-3 text-xs font-bold text-red-500 hover:text-red-700">
                        Quitar esta imagen
                      </button>
                    )}
                  </div>
                ))}
                {images.length < MAX_IMAGES && (
                  <button type="button" onClick={() => setImages((current) => [...current, ''])} className="w-full border border-dashed border-[#8B5A5A]/40 rounded-xl px-4 py-3 text-sm font-bold text-[#8B5A5A] hover:bg-[#8B5A5A]/5 transition-colors flex items-center justify-center gap-2">
                    <Plus size={16} /> Agregar otra imagen ({images.length}/{MAX_IMAGES})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
