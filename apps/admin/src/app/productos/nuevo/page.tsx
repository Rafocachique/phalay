'use client';

import { createProduct } from '@/app/actions/products';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';
import { ChevronLeft, Save, Plus, Trash2, Info, RefreshCw } from 'lucide-react';

type ColorItem = { name: string; hex: string };
type VariantStock = Record<string, number>; // key = "size:color"

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

export default function NuevoProductoPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [image1, setImage1] = useState('');
  const [image2, setImage2] = useState('');
  const [image3, setImage3] = useState('');

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

  // Add custom color
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#8B5A5A');

  // Categories and Collections
  const [categories, setCategories] = useState<any[]>([]);
  const [collectionsList, setCollectionsList] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  useEffect(() => {
    fetch(`${API_BASE_URL}/products/categories`)
      .then(res => res.json())
      .then(data => { setCategories(data); if (data.length > 0) setSelectedCategoryId(data[0].id); })
      .catch(() => {});
    fetch(`${API_BASE_URL}/collections`)
      .then(res => res.json())
      .then(data => setCollectionsList(data))
      .catch(() => {});
  }, [API_BASE_URL]);

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
  const setVariantStock = (size: string, colorName: string, value: number) => {
    const key = `${size}:${colorName}`;
    setVariantStocks(prev => ({ ...prev, [key]: value }));
  };

  // Total stock to show
  const totalStock = getVariantCombinations().reduce((sum, { size, color }) => {
    return sum + getVariantStock(size, color.name);
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
    const urls = [image1, image2, image3].filter(Boolean);
    formData.set('images', JSON.stringify(urls));

    // Tags for sizes and colors
    const tags = [
      ...selectedSizes.map(s => `size:${s}`),
      ...selectedColors.map(c => `color:${c.name}:${c.hex}`),
    ];
    formData.set('tags', JSON.stringify(tags));

    // Build variants payload with individual stocks
    const variants = getVariantCombinations().map(({ size, color }) => ({
      size,
      color: color.name,
      colorHex: color.hex,
      stock: getVariantStock(size, color.name),
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
                  {AVAILABLE_SIZES.map((talla) => {
                    const isSelected = selectedSizes.includes(talla);
                    return (
                      <button key={talla} type="button"
                        onClick={() => setSelectedSizes(isSelected ? selectedSizes.filter(s => s !== talla) : [...selectedSizes, talla])}
                        className={`w-12 h-10 rounded-xl font-bold text-sm border transition-all flex items-center justify-center ${isSelected ? 'bg-[#FBEFEF] text-[#8B5A5A] border-[#8B5A5A] scale-105 shadow-sm' : 'bg-white text-gray-400 border-gray-200 hover:border-[#8B5A5A]/50'}`}>
                        {talla}
                      </button>
                    );
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
                                onChange={e => setVariantStock(size, color.name, Number(e.target.value))}
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
                    <div className="w-full bg-[#F8F9FA] rounded-xl p-4 text-xs text-gray-400 italic">Cargando...</div>
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
                  <label className="block text-sm font-bold text-gray-900 mb-3">Colecciones del Producto</label>
                  {collectionsList.length === 0 ? (
                    <p className="text-xs text-gray-400 italic bg-[#F8F9FA] rounded-xl p-4">No hay colecciones creadas.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5 max-h-[160px] overflow-y-auto pr-1">
                      {collectionsList.map((col) => {
                        const isChecked = selectedCollectionIds.includes(col.id);
                        return (
                          <label key={col.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${isChecked ? 'bg-[#FBEFEF] border-[#8B5A5A]/50 text-[#8B5A5A] font-bold shadow-sm' : 'bg-[#F8F9FA] border-transparent text-gray-600 hover:border-gray-200'}`}>
                            <input type="checkbox" checked={isChecked}
                              onChange={() => setSelectedCollectionIds(isChecked ? selectedCollectionIds.filter(id => id !== col.id) : [...selectedCollectionIds, col.id])}
                              className="hidden" />
                            <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${isChecked ? 'bg-[#8B5A5A] border-[#8B5A5A] text-white' : 'border-gray-300 bg-white'}`}>
                              {isChecked && <span className="text-[10px] font-black">✓</span>}
                            </div>
                            <span className="text-xs">{col.name}</span>
                          </label>
                        );
                      })}
                    </div>
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
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <ImageUpload name="main_image" label="Imagen Principal (Catálogo)" currentUrl={image1} onUrlChange={setImage1} />
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <ImageUpload name="image_2" label="Imagen Detalle 1 (Opcional)" currentUrl={image2} onUrlChange={setImage2} />
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <ImageUpload name="image_3" label="Imagen Detalle 2 (Opcional)" currentUrl={image3} onUrlChange={setImage3} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
