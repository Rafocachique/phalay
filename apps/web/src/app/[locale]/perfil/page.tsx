import Link from 'next/link';

export default function PerfilPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top Navbar Simple */}
      <nav className="w-full border-b border-gray-100 bg-white z-40 sticky top-0">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-black tracking-tighter">PHALAY</Link>
          <Link href="/catalogo" className="text-sm font-semibold uppercase tracking-widest text-dark-500 hover:text-dark-900">Volver a la tienda</Link>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-6 py-16 animate-enter">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Sidebar Perfil */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary-500 to-tertiary-500 p-[2px]">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-xl font-black text-dark-900">
                  V
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-dark-900">Valeria Méndez</h2>
                <p className="text-sm text-dark-500">Miembro desde 2026</p>
              </div>
            </div>

            <nav className="space-y-1">
              <a href="#" className="block px-4 py-3 bg-gray-50 text-dark-900 font-semibold rounded-xl border border-gray-100">Mis Pedidos</a>
              <a href="#" className="block px-4 py-3 text-dark-500 hover:bg-gray-50 font-medium rounded-xl transition-colors">Wishlist (12)</a>
              <a href="#" className="block px-4 py-3 text-dark-500 hover:bg-gray-50 font-medium rounded-xl transition-colors">Direcciones</a>
              <a href="#" className="block px-4 py-3 text-dark-500 hover:bg-gray-50 font-medium rounded-xl transition-colors">Seguridad</a>
              <div className="pt-4 mt-4 border-t border-gray-100">
                <a href="#" className="block px-4 py-3 text-red-500 hover:bg-red-50 font-medium rounded-xl transition-colors">Cerrar Sesión</a>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-4">
              <h1 className="text-3xl font-black text-dark-900">Historial de Pedidos</h1>
            </div>

            <div className="space-y-6">
              {/* Order Card 1 */}
              <div className="card-premium">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-dark-900 mb-1">Pedido #ORD-9823</h3>
                    <p className="text-sm text-dark-500">Realizado el 12 de Mayo, 2026</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-green-200">
                      Entregado
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 py-6 border-y border-gray-100">
                  <div className="w-20 aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    <img src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&q=80" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-dark-900">Vestido Asimétrico Seda</h4>
                    <p className="text-sm text-dark-500 mb-2">Talla S / Color Negro</p>
                    <p className="font-bold text-dark-900">S/ 290.00</p>
                  </div>
                  <button className="btn-outline px-6 py-2 text-sm">Comprar de nuevo</button>
                </div>

                <div className="flex justify-between items-center pt-6">
                  <span className="text-sm font-semibold uppercase tracking-wider text-dark-500">Pagado con Yape</span>
                  <p className="text-xl font-black text-dark-900">Total: S/ 305.00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
