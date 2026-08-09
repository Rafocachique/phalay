'use client';

import { updateProduct } from '@/app/actions/products';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';
import { ChevronLeft, Save, Plus, Trash2 } from 'lucide-react';

interface CatalogOption {
  id: string;
  name: string;
}

interface EditarProductoFormProps {
  product: any;
  categories: CatalogOption[];
  collections: CatalogOption[];
  catalogFailed: boolean;
}

export default function EditarProductoForm({
  product,
  categories,
  collections: collectionsList,
  catalogFailed,
}: EditarProductoFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [image1, setImage1] = useState(product.images?.[0]?.url || '');
  const [image2, setImage2] = useState(product.images?.[1]?.url || '');
  const [image3, setImage3] = useState(product.images?.[2]?.url || '');

  // Parse saved sizes and colors from database product tags
  const initialSizes = (product.tags || [])
    .filter((tag: string) => tag.startsWith('size:'))
    .map((tag: string) => tag.replace('size:', ''));

  const initialColors = (product.tags || [])
    .filter((tag: string) => tag.startsWith('color:'))
    .map((tag: string) => {
      const parts = tag.replace('color:', '').split(':');
      return { name: parts[0], hex: parts[1] || '#000000' };
    });

  // Interactive variants states
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    initialSizes.length > 0 ? initialSizes : ['S', 'M']
  );
  const [selectedColors, setSelectedColors] = useState<{ name: string; hex: string }[]>(
    initialColors.length > 0 ? initialColors : [
      { name: 'Rosa Pastel', hex: '#E8B4B8' },
      { name: 'Marfil', hex: '#FFFFFF' },
      { name: 'Negro', hex: '#111111' },
    ]
  );

  // Initialize variantStocks from product.variants using format "size:color" as key
  const [variantStocks, setVariantStocks] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    if (product.variants && Array.isArray(product.variants)) {
      for (const variant of product.variants) {
        const key = `${variant.size || ''}:${variant.color || ''}`;
        initial[key] = variant.stock;
      }
    }
    return initial;
  });

  // Add custom color inputs state
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#8B5A5A');

  // Los tipos de prenda y colecciones llegan ya cargados desde el servidor.
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    product.categoryId || categories[0]?.id || '',
  );
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(
    (product.collections || []).map((col: any) => col.id)
  );

  // Generate active combinations to display and serialize variant stocks payload
  const activeCombinations: Array<{ size: string; color: { name: string; hex: string } }> = [];
  for (const size of selectedSizes) {
    for (const color of selectedColors) {
      activeCombinations.push({ size, color });
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (selectedSizes.length === 0) {
      toast.error('Debes seleccionar al menos una talla disponible.');
      return;
    }
    if (selectedColors.length === 0) {
      toast.error('Debes agregar al menos un color o tonalidad para la prenda.');
      return;
    }

    setSubmitting(true);
    const urls = [image1, image2, image3].filter(Boolean);
    formData.set('images', JSON.stringify(urls));

    const tags = [
      ...selectedSizes.map(s => `size:${s}`),
      ...selectedColors.map(c => `color:${c.name}:${c.hex}`),
    ];
    formData.set('tags', JSON.stringify(tags));

    formData.set('categoryId', selectedCategoryId);
    formData.set('collectionIds', JSON.stringify(selectedCollectionIds));

    const variantsPayload = activeCombinations.map(({ size, color }) => {
      const key = `${size}:${color.name}`;
      const stock = variantStocks[key] !== undefined ? variantStocks[key] : 10;
      return { size, color: color.name, colorHex: color.hex, stock };
    });
    formData.set('variants', JSON.stringify(variantsPayload));

    const result = await updateProduct(product.id, formData);
    setSubmitting(false);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success('Producto actualizado exitosamente');
      router.push('/productos');
      router.refresh();
    }
  }

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
              <span className="font-semibold text-gray-800">Editar Producto</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Editar Producto</h1>
          </div>
          
          <button 
            type="submit" 
            disabled={submitting}
            className="bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50"
          >
            <Save size={18} />
            {submitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: General Product Information */}
          <div className="flex-[3] space-y-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-xl font-bold text-gray-900 border-b border-gray-50 pb-3">Información General</h2>
              
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Nombre del Producto</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  defaultValue={product.name}
                  placeholder="Ej. Vestido Seda 'Amanecer'" 
                  className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 transition-colors" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Descripción Detallada</label>
                <div className="bg-[#F8F9FA] border border-transparent focus-within:bg-white focus-within:border-[#8B5A5A] rounded-xl overflow-hidden transition-all">
                  <textarea 
                    name="description" 
                    required 
                    rows={6} 
                    defaultValue={product.description}
                    placeholder="Describe los detalles de confección, corte, caída y sensaciones de la prenda..." 
                    className="w-full bg-transparent border-none p-4 outline-none text-gray-900 resize-none text-sm"
                  ></textarea>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Precio (S/)</label>
                  <div className="flex items-center bg-[#F8F9FA] rounded-xl px-4 py-3.5 focus-within:bg-white focus-within:ring-1 focus-within:ring-[#8B5A5A] transition-all">
                    <span className="text-gray-400 mr-2 font-semibold">S/</span>
                    <input 
                      type="number" 
                      name="price" 
                      step="0.01" 
                      required 
                      defaultValue={product.price}
                      placeholder="0.00" 
                      className="w-full bg-transparent border-none outline-none text-gray-900 font-bold" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">SKU / Código Único</label>
                  <input 
                    type="text" 
                    name="sku" 
                    required 
                    defaultValue={product.sku}
                    className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 font-mono transition-colors" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Inventario Total</label>
                  <input 
                    type="number" 
                    name="stock"
                    readOnly
                    value={activeCombinations.reduce((acc, { size, color }) => acc + (variantStocks[`${size}:${color.name}`] || 0), 0)}
                    className="w-full bg-gray-100 border border-transparent rounded-xl px-4 py-3.5 outline-none text-gray-600 font-bold transition-colors cursor-not-allowed" 
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Se calcula automáticamente sumando las variantes.</p>
                </div>
              </div>
            </div>

            {/* Variantes (Tallas y Colores Estilizados y TOTALMENTE INTERACTIVOS) */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-50 pb-3">Tallas y Presentación</h2>
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-gray-900">Tallas Disponibles</h3>
                    <span className="text-xs text-gray-400">Haz clic para activar/desactivar</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['XS', 'S', 'M', 'L', 'XL'].map((talla) => {
                      const isSelected = selectedSizes.includes(talla);
                      return (
                        <button 
                          key={talla}
                          type="button" 
                          onClick={() => {
                            if (isSelected) {
                              setSelectedSizes(selectedSizes.filter(s => s !== talla));
                            } else {
                              setSelectedSizes([...selectedSizes, talla]);
                            }
                          }}
                          className={`w-12 h-10 rounded-xl font-bold text-sm border transition-all flex items-center justify-center ${
                            isSelected 
                              ? 'bg-[#FBEFEF] text-[#8B5A5A] border-[#8B5A5A] scale-105 shadow-sm' 
                              : 'bg-white text-gray-400 border-gray-200 hover:border-[#8B5A5A]/50'
                          }`}
                        >
                          {talla}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-gray-900">Tonalidad General</h3>
                    <span className="text-xs text-gray-400">Tonalidades y colores activos</span>
                  </div>
                  
                  {/* Badges de Colores Interactivos */}
                  <div className="flex flex-wrap gap-3 items-center mb-6">
                    {selectedColors.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No hay colores agregados. Agrega uno abajo.</p>
                    ) : (
                      selectedColors.map((color, index) => (
                        <div key={index} className="flex items-center gap-2 bg-[#F8F9FA] px-3.5 py-2 rounded-full border border-gray-100 group shadow-sm transition-all hover:bg-gray-50">
                          <div className="w-4 h-4 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: color.hex }}></div>
                          <span className="text-xs font-semibold text-gray-700">{color.name}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedColors(selectedColors.filter((_, idx) => idx !== index))}
                            className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                            title="Eliminar color"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Creador de Colores en un solo clic */}
                  <div className="pt-5 border-t border-gray-100 flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1 w-full">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nombre del Color</label>
                      <input
                        type="text"
                        placeholder="Ej. Verde Oliva, Rosa Pastel, Hueso"
                        value={newColorName}
                        onChange={e => setNewColorName(e.target.value)}
                        className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-2.5 text-xs focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 transition-colors"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Muestra</label>
                      <div className="flex items-center bg-[#F8F9FA] rounded-xl px-3 py-1.5 border border-transparent focus-within:bg-white focus-within:border-[#8B5A5A] transition-colors h-[38px] w-full">
                        <input
                          type="color"
                          value={newColorHex}
                          onChange={e => setNewColorHex(e.target.value)}
                          className="w-full h-6 border-none bg-transparent cursor-pointer rounded outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newColorName.trim()) {
                          toast.error('Por favor ingresa un nombre para el color.');
                          return;
                        }
                        setSelectedColors([...selectedColors, { name: newColorName.trim(), hex: newColorHex }]);
                        setNewColorName('');
                      }}
                      className="bg-[#8B5A5A]/10 hover:bg-[#8B5A5A]/20 text-[#8B5A5A] px-5 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1 h-[38px] cursor-pointer"
                    >
                      <Plus size={14} /> Agregar Color
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Control de Stock por Variante */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 space-y-6">
              <div className="border-b border-gray-50 pb-3">
                <h2 className="text-xl font-bold text-gray-900">Control de Stock por Variante</h2>
                <p className="text-xs text-gray-400 mt-1">Define el stock disponible para cada combinación de talla y color.</p>
              </div>

              {activeCombinations.length === 0 ? (
                <p className="text-xs text-gray-400 italic bg-[#F8F9FA] rounded-xl p-4">
                  Selecciona al menos una talla y un color para generar las variantes de stock.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-bold text-xs uppercase tracking-wider">
                        <th className="py-3 px-4">Talla</th>
                        <th className="py-3 px-4">Color</th>
                        <th className="py-3 px-4 w-40">Stock Disponible</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {activeCombinations.map(({ size, color }) => {
                        const key = `${size}:${color.name}`;
                        const stockVal = variantStocks[key] !== undefined ? variantStocks[key] : 10;
                        return (
                          <tr key={key} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-4 font-bold text-gray-900">{size}</td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-3.5 h-3.5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: color.hex }}></div>
                                <span className="font-medium text-gray-700">{color.name}</span>
                              </div>
                            </td>
                            <td className="py-2 px-4">
                              <input
                                type="number"
                                min="0"
                                required
                                value={stockVal}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  const safeVal = isNaN(val) ? 0 : Math.max(0, val);
                                  setVariantStocks(prev => ({
                                    ...prev,
                                    [key]: safeVal,
                                  }));
                                }}
                                className="w-28 bg-[#F8F9FA] border border-transparent rounded-xl px-3 py-2 text-center focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 font-bold transition-colors"
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

            {/* Categorización y Relación con Colecciones */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-xl font-bold text-gray-900 border-b border-gray-50 pb-3">Tipo de Prenda y Colecciones</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Catálogo / Categoría */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Tipo de Prenda</label>
                  {categories.length === 0 ? (
                    <div className={`w-full rounded-xl p-4 text-xs ${catalogFailed ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-[#F8F9FA] text-gray-500 italic'}`}>
                      {catalogFailed
                        ? 'No pudimos cargar los tipos de prenda. Revisa que el servidor esté disponible y recarga la página.'
                        : 'Aún no hay tipos de prenda. Créalos en la sección Catálogo.'}
                    </div>
                  ) : (
                    <select
                      name="categoryId"
                      value={selectedCategoryId}
                      onChange={e => setSelectedCategoryId(e.target.value)}
                      className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 font-bold transition-colors cursor-pointer text-sm"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Colecciones Relacionadas */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Colecciones del Producto</label>
                  {collectionsList.length === 0 ? (
                    <p className={`text-xs rounded-xl p-4 ${catalogFailed ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-[#F8F9FA] text-gray-500 italic'}`}>
                      {catalogFailed
                        ? 'No pudimos cargar las colecciones. Revisa que el servidor esté disponible y recarga la página.'
                        : 'Aún no hay colecciones. Créalas en la sección Colecciones.'}
                    </p>
                  ) : (
                    <select
                      value={selectedCollectionIds[0] || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setSelectedCollectionIds(val ? [val] : []);
                      }}
                      className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 font-bold transition-colors cursor-pointer text-sm"
                    >
                      <option value="">Ninguna colección</option>
                      {collectionsList.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Images Gallery Uploads */}
          <div className="flex-[2] space-y-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Galería del Producto</h2>
                <p className="text-xs text-gray-400 mt-1">Sube fotos reales de tus prendas. Soporta JPG, PNG y WebP.</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <ImageUpload 
                    name="main_image" 
                    label="Imagen Principal (Vista de Catálogo)" 
                    currentUrl={image1}
                    onUrlChange={setImage1}
                  />
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <ImageUpload 
                    name="image_2" 
                    label="Imagen Detalle 1 (Opcional)" 
                    currentUrl={image2}
                    onUrlChange={setImage2}
                  />
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <ImageUpload 
                    name="image_3" 
                    label="Imagen Detalle 2 (Opcional)" 
                    currentUrl={image3}
                    onUrlChange={setImage3}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
