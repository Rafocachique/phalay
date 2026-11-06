'use client';
import Link from 'next/link';
import { Trash2, ShoppingBag, ArrowRight, Package } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const subtotal = total;
  const shipping = total > 0 ? 15 : 0;
  const grandTotal = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#F8F8F8] py-24">
        <ShoppingBag size={64} className="text-gray-200 mb-6" strokeWidth={1} />
        <h1 className="text-2xl font-serif text-gray-900 mb-2">Tu bolsa está vacía</h1>
        <p className="text-gray-500 mb-8 text-sm">Explora nuestra colección y encuentra algo que te encante.</p>
        <Link
          href="/catalogo"
          className="bg-black text-white px-8 py-3 text-sm font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors"
        >
          Explorar Catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] py-12">
      <div className="max-w-[1400px] mx-auto px-6">
        <h1 className="text-3xl font-serif text-gray-900 mb-2">Tu Bolsa</h1>
        <p className="text-sm text-gray-500 mb-10">{items.reduce((s, i) => s + i.quantity, 0)} artículo(s)</p>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Lista de productos */}
          <div className="flex-[2] space-y-6">
            {items.map((item) => (
              <div key={`${item.id}-${item.size}-${item.color}`} className="bg-white border border-gray-100 p-6 flex gap-6">
                <div className="w-24 h-32 bg-gray-100 overflow-hidden flex-shrink-0">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 text-sm">{item.name}</h3>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mb-4 space-y-1">
                    {item.size && <p>Talla: <span className="font-medium text-gray-700">{item.size}</span></p>}
                    {item.color && <p>Color: <span className="font-medium text-gray-700">{item.color}</span></p>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-gray-200">
                      <button
                        onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeItem(item.id)}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                      >−</button>
                      <span className="w-10 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                      >+</button>
                    </div>
                    <span className="font-bold text-gray-900">S/ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={clearCart}
              className="text-xs text-gray-400 hover:text-red-500 underline transition-colors"
            >
              Vaciar bolsa
            </button>
          </div>

          {/* Resumen del pedido */}
          <div className="flex-1">
            <div className="bg-white border border-gray-100 p-8 sticky top-28">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Resumen del Pedido</h2>

              <div className="space-y-4 text-sm text-gray-600 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">S/ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío estimado</span>
                  <span className="font-medium text-gray-900">S/ {shipping.toFixed(2)}</span>
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-1.5 bg-gray-50 p-3 rounded">
                  <Package size={14} />
                  Lima 2-3 días · Provincias 5-7 días hábiles
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6 flex justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-gray-900 text-lg">S/ {grandTotal.toFixed(2)}</span>
              </div>

              <Link
                href="/checkout"
                className="w-full bg-black hover:bg-gray-800 text-white py-4 font-bold tracking-widest uppercase transition-colors flex justify-center items-center gap-2"
              >
                Proceder al Pago <ArrowRight size={16} />
              </Link>

              <div className="mt-4 text-center">
                <Link href="/catalogo" className="text-xs text-gray-500 hover:text-black underline transition-colors">
                  Seguir comprando
                </Link>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 space-y-2 text-[11px] text-gray-400">
                <p>✓ Compra 100% segura</p>
                <p>✓ Cambios y devoluciones en 15 días</p>
                <p>✓ Soporte por WhatsApp</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
