import Link from 'next/link';

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6">
      <div className="bg-white max-w-lg w-full rounded-[2rem] p-12 text-center shadow-sm border border-gray-100 animate-enter">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✓</span>
        </div>
        
        <h1 className="text-3xl font-black text-gray-900 mb-2">¡Pedido Confirmado!</h1>
        <p className="text-gray-500 mb-8 font-medium">Hemos recibido tu pedido correctamente. La administradora validará tu pago por Yape en breve.</p>
        
        <div className="bg-gray-50 rounded-2xl p-6 text-left mb-8">
          <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-widest border-b border-gray-200 pb-2">Detalles del Pedido</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Orden</span>
              <span className="font-bold">#PHL-8821</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Pagado</span>
              <span className="font-bold text-[#8B5A5A]">S/ 434.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Método</span>
              <span className="font-bold">Yape</span>
            </div>
          </div>
        </div>

        <Link href="/catalogo" className="inline-block w-full py-4 bg-black hover:bg-gray-900 text-white font-bold rounded-xl transition-colors">
          SEGUIR COMPRANDO
        </Link>
      </div>
    </div>
  );
}
