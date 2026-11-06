import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <h1 className="text-7xl font-black text-[#8B5A5A] mb-4">404</h1>
      <p className="text-xl font-bold text-gray-900 mb-2">Página no encontrada</p>
      <p className="text-sm text-gray-500 mb-8 max-w-sm">La sección que buscas no existe o fue movida. Vuelve al panel principal.</p>
      <Link href="/" className="bg-[#8B5A5A] hover:bg-[#A87474] text-white px-8 py-3.5 rounded-xl font-bold transition-colors">
        Volver al Dashboard
      </Link>
    </div>
  );
}
