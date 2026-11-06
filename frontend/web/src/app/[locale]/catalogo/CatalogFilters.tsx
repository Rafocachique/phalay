'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ColorOption {
  name: string;
  hex: string;
}

interface CatalogFiltersProps {
  categories: Category[];
  sizes: string[];
  colors: ColorOption[];
  minPrice: number;
  maxPrice: number;
}

export default function CatalogFilters({
  categories,
  sizes,
  colors,
  minPrice,
  maxPrice,
}: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Read current filters from URL search params
  const currentCategory = searchParams.get('categoria') || '';
  const currentSize = searchParams.get('talla') || '';
  const currentColor = searchParams.get('color') || '';
  const currentMaxPrice = searchParams.get('maxPrice') 
    ? parseInt(searchParams.get('maxPrice')!) 
    : maxPrice;

  // Selected categories list parsed from comma-separated URL param
  const selectedCategories = currentCategory 
    ? currentCategory.split(',').filter(Boolean) 
    : [];

  // Local states
  const [localMaxPrice, setLocalMaxPrice] = useState(currentMaxPrice);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Dropdown ref for click outside
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync state with URL changes
  useEffect(() => {
    setLocalMaxPrice(currentMaxPrice);
  }, [currentMaxPrice, maxPrice]);

  // Click outside listener to close the category dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update query params helper
  const updateQueryParam = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCategoryToggle = (categoryName: string) => {
    let nextCategories = [...selectedCategories];
    if (nextCategories.includes(categoryName)) {
      nextCategories = nextCategories.filter(c => c !== categoryName);
    } else {
      nextCategories.push(categoryName);
    }
    updateQueryParam({ categoria: nextCategories.length > 0 ? nextCategories.join(',') : null });
  };

  const handleSizeClick = (size: string) => {
    if (currentSize === size) {
      updateQueryParam({ talla: null });
    } else {
      updateQueryParam({ talla: size });
    }
  };

  const handleColorClick = (colorName: string) => {
    if (currentColor === colorName) {
      updateQueryParam({ color: null });
    } else {
      updateQueryParam({ color: colorName });
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalMaxPrice(parseInt(e.target.value));
  };

  const handlePriceMouseUp = () => {
    updateQueryParam({ maxPrice: localMaxPrice.toString() });
  };

  const clearAllFilters = () => {
    setIsMobileOpen(false);
    setIsDropdownOpen(false);
    router.push(pathname);
  };

  // Label text for category selector dropdown
  const getDropdownLabel = () => {
    if (selectedCategories.length === 0) return 'Todos los Catálogos';
    if (selectedCategories.length === 1) return selectedCategories[0];
    return `${selectedCategories.length} seleccionados`;
  };

  // Render filter list elements (reusable for desktop & mobile)
  const renderFiltersContent = () => (
    <div className="space-y-8">
      {/* Categoría (ComboBox / Custom Multiselect Dropdown) */}
      <div>
        <h3 className="text-xs font-bold text-gray-700 tracking-widest uppercase mb-3">Catálogos</h3>
        
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900 focus:bg-white focus:border-[#8B5A5A] outline-none transition-all cursor-pointer font-medium text-left"
          >
            <span className="truncate">{getDropdownLabel()}</span>
            <ChevronDown size={16} className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-150 rounded-xl shadow-lg p-2.5 max-h-60 overflow-y-auto space-y-1">
              <button
                type="button"
                onClick={() => updateQueryParam({ categoria: null })}
                className="w-full text-left px-3 py-2 text-xs font-bold text-[#8B5A5A] hover:bg-[#FBEFEF] rounded-lg transition-colors border-b border-gray-100 mb-1"
              >
                Limpiar Selección
              </button>
              {categories.map((cat) => {
                const isChecked = selectedCategories.includes(cat.name);
                return (
                  <label
                    key={cat.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer text-sm text-gray-700 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleCategoryToggle(cat.name)}
                      className="rounded border-gray-300 text-[#8B5A5A] focus:ring-[#8B5A5A] w-4 h-4 cursor-pointer"
                    />
                    <span className={`transition-colors ${isChecked ? 'text-[#8B5A5A] font-bold' : ''}`}>
                      {cat.name}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Talla */}
      <div>
        <h3 className="text-xs font-bold text-gray-700 tracking-widest uppercase mb-4">Talla</h3>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => {
            const isSelected = currentSize === size;
            return (
              <button
                key={size}
                onClick={() => handleSizeClick(size)}
                className={`w-11 h-9 rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-black border-black text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-950'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color */}
      <div>
        <h3 className="text-xs font-bold text-gray-700 tracking-widest uppercase mb-4">Color</h3>
        <div className="flex flex-wrap gap-3">
          {colors.map((col) => {
            const isSelected = currentColor === col.name;
            return (
              <button
                key={col.name}
                onClick={() => handleColorClick(col.name)}
                style={{ backgroundColor: col.hex }}
                className={`w-8 h-8 rounded-full border transition-all ${
                  isSelected
                    ? 'ring-2 ring-[#8B5A5A] ring-offset-2 scale-110 border-transparent shadow'
                    : 'border-gray-200 hover:scale-105'
                }`}
                title={col.name}
              />
            );
          })}
        </div>
      </div>

      {/* Precio */}
      <div>
        <h3 className="text-xs font-bold text-gray-700 tracking-widest uppercase mb-4">Rango de Precio</h3>
        <div className="space-y-4">
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            step={5}
            value={localMaxPrice}
            onChange={handlePriceChange}
            onMouseUp={handlePriceMouseUp}
            onTouchEnd={handlePriceMouseUp}
            className="w-full h-1.5 bg-gray-150 rounded-lg appearance-none cursor-pointer accent-[#8B5A5A]"
          />
          <div className="flex justify-between text-xs font-bold text-gray-500">
            <span>S/ {minPrice}</span>
            <span className="text-[#8B5A5A] bg-[#FBEFEF] px-2 py-0.5 rounded-md border border-[#8B5A5A]/10">S/ {localMaxPrice}</span>
          </div>
        </div>
      </div>

      <button
        onClick={clearAllFilters}
        className="w-full bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white py-3.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-colors shadow-sm"
      >
        Limpiar Filtros
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile view trigger button */}
      <div className="md:hidden w-full mb-6">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 py-3.5 px-4 rounded-xl text-sm font-bold text-gray-700 hover:border-black transition-all shadow-sm"
        >
          <SlidersHorizontal size={16} />
          Filtrar Catálogo
        </button>
      </div>

      {/* Desktop view sidebar */}
      <aside className="hidden md:block w-64 shrink-0">
        <div className="bg-white p-6 border border-gray-100 rounded-[2rem] shadow-sm sticky top-28 space-y-6">
          <div>
            <h2 className="text-xl font-serif text-gray-900 mb-1">Filtros</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ajusta tu búsqueda</p>
          </div>
          {renderFiltersContent()}
        </div>
      </aside>

      {/* Mobile drawer backdrop and panel */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Side Drawer Panel */}
          <div className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white py-6 px-6 shadow-xl animate-slide-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-serif text-gray-900">Filtros</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ajusta tu búsqueda</p>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-150 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {renderFiltersContent()}

            <div className="mt-8 pt-4 border-t border-gray-100">
              <button
                onClick={() => setIsMobileOpen(false)}
                className="w-full bg-black text-white py-3.5 rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-gray-900 transition-colors shadow-sm"
              >
                Ver Diseños
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
