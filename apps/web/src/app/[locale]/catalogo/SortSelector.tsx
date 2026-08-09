'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function SortSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentSort = searchParams.get('sort') || 'tendencias';

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value === 'tendencias') {
      params.delete('sort');
    } else {
      params.set('sort', e.target.value);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      value={currentSort}
      onChange={handleSortChange}
      className="bg-transparent font-bold text-gray-900 outline-none cursor-pointer"
    >
      <option value="tendencias">Tendencias</option>
      <option value="precio_asc">Menor Precio</option>
      <option value="precio_desc">Mayor Precio</option>
    </select>
  );
}
