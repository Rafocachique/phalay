import { fetchPublicApi } from '@/lib/public-api';
import { LegalDocument } from '@/components/legal/LegalDocument';

export const dynamic = 'force-dynamic';

export default async function TerminosPage() {
  const store = await fetchPublicApi<Record<string, any> | null>('/stores', null);
  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-20 pt-24">
      <div className="mx-auto max-w-3xl animate-enter px-6">
        <h1 className="mb-2 font-serif text-4xl text-gray-900">Términos y Condiciones</h1>
        <p className="mb-12 text-sm text-gray-500">Versión publicada por {store?.storeName || 'la tienda'}</p>
        <article className="max-w-none rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm md:p-12">
          <LegalDocument content={store?.legalTermsContent || ''} store={store || {}} />
        </article>
      </div>
    </div>
  );
}
