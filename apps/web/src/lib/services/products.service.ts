import { fetchApi } from '../api-client';

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  price: string;
  compareAtPrice: string | null;
  images: { url: string; isMain: boolean }[];
  status: string;
  category: { name: string; slug: string };
  store: { name: string; slug: string };
  createdAt: string;
}

export const ProductsService = {
  /**
   * Obtiene la lista de productos del catálogo.
   */
  async getProducts(params?: { limit?: number; category?: string }): Promise<Product[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.category) searchParams.append('category', params.category);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return fetchApi<Product[]>(`/products${query}`);
  },

  /**
   * Obtiene un producto individual por su slug.
   */
  async getProductBySlug(slug: string): Promise<Product> {
    return fetchApi<Product>(`/products/slug/${slug}`);
  }
};
