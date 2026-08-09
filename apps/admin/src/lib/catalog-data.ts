import { API_BASE_URL } from './api';

export interface CategoryOption {
  id: string;
  name: string;
}

export interface CollectionOption {
  id: string;
  name: string;
}

export interface CatalogOptions {
  categories: CategoryOption[];
  collections: CollectionOption[];
  /** true cuando la API no respondió: permite distinguir "vacío" de "falló la carga". */
  failed: boolean;
}

/**
 * Carga tipos de prenda y colecciones DESDE EL SERVIDOR.
 *
 * Antes se pedían desde el navegador, y en producción el navegador choca con
 * CORS (la API sólo acepta los orígenes de CORS_ALLOWED_ORIGINS), así que el
 * selector se quedaba en "Cargando tipos de prenda..." para siempre. Desde el
 * servidor no hay CORS de por medio.
 */
export async function getCatalogOptions(): Promise<CatalogOptions> {
  const [categoriesRes, collectionsRes] = await Promise.allSettled([
    fetch(`${API_BASE_URL}/products/categories`, { cache: 'no-store' }),
    fetch(`${API_BASE_URL}/collections`, { cache: 'no-store' }),
  ]);

  let failed = false;

  const readList = async (result: PromiseSettledResult<Response>): Promise<any[]> => {
    if (result.status !== 'fulfilled' || !result.value.ok) {
      failed = true;
      return [];
    }
    try {
      const data = await result.value.json();
      // Algunos endpoints devuelven el array directo y otros { data: [...] }.
      const list = Array.isArray(data) ? data : data?.data;
      return Array.isArray(list) ? list : [];
    } catch {
      failed = true;
      return [];
    }
  };

  const categories = await readList(categoriesRes);
  const collections = await readList(collectionsRes);

  return {
    categories: categories.map((c: any) => ({ id: c.id, name: c.name })),
    collections: collections.map((c: any) => ({ id: c.id, name: c.name })),
    failed,
  };
}
