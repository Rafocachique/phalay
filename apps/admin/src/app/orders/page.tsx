import OrderStatusSelect from '@/components/OrderStatusSelect';
import PaymentReview from '@/components/PaymentReview';
import { Package, User, ShoppingBag, MapPin, Calendar } from 'lucide-react';
import { getAuthHeader } from '@/lib/auth-header';
import { DeleteButton } from '@/components/DeleteButton';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function getOrders() {
  try {
    const authHeaders = await getAuthHeader();
    const res = await fetch(`${API_BASE_URL}/orders`, { headers: authHeaders, cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    return [];
  }
}

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="animate-enter w-full pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Gestión de Pedidos</h1>
        <p className="text-gray-500 font-medium text-sm">Monitorea las ventas, despacha paquetes y mantén informados a tus clientes en tiempo real.</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-gray-100 p-16 text-center shadow-sm">
          <Package size={56} className="text-gray-200 mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-gray-800 mb-2">No hay pedidos registrados</h2>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">Cuando tus clientes realicen compras en la tienda, aparecerán listados aquí en tiempo real.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order: any) => {
            const formattedDate = new Date(order.createdAt).toLocaleDateString('es-PE', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={order.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                {/* Header */}
                <div className="bg-gray-50/50 px-8 py-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono font-black text-gray-900 text-base">{order.orderNumber}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs font-semibold">
                      <Calendar size={13} />
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Estado del Pedido:</span>
                    <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                    <div className="ml-2 pl-2 border-l border-gray-200">
                      <DeleteButton
                        id={order.id}
                        type="order"
                        entityName={`el pedido ${order.orderNumber}`}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-xl transition-all font-semibold text-xs flex items-center gap-1.5"
                      >
                        Eliminar Pedido
                      </DeleteButton>
                    </div>
                  </div>
                </div>

                {/* Verificación del pago: para Yape con QR el equipo confirma
                    aquí que el dinero llegó, tras revisar la captura. */}
                <div className="px-8 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pago:</span>
                  <PaymentReview
                    orderId={order.id}
                    paymentStatus={order.paymentStatus}
                    paymentMethod={order.paymentMethod}
                    total={order.total}
                  />
                </div>

                {/* Body Content */}
                <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Customer & Delivery Details */}
                  <div className="space-y-4 border-r border-gray-100 pr-0 lg:pr-8">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#FBEFEF] text-[#8B5A5A] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-1">Cliente</h4>
                        <p className="text-sm font-bold text-gray-900">{order.customer?.firstName} {order.customer?.lastName}</p>
                        <p className="text-xs text-gray-500">{order.customer?.email}</p>
                        {/* Se prioriza el teléfono que dejó en este pedido:
                            es el número con el que coordinar esta entrega. */}
                        <p className="text-xs text-gray-500">
                          Cel: {order.address?.phone || order.customer?.phone || '-'}
                        </p>
                        {order.customer?.dni && (
                          <p className="text-xs text-gray-500">DNI: {order.customer.dni}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-1">Dirección de Despacho</h4>
                        <p className="text-sm text-gray-700 leading-snug">{order.address?.street}</p>
                        <p className="text-xs text-gray-500">{order.address?.city}, {order.address?.state}</p>
                        <p className="text-[11px] text-gray-400 mt-1">Método de Pago: <strong className="text-gray-600 capitalize">{order.paymentMethod.toLowerCase()}</strong></p>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Items Ordered */}
                  <div className="space-y-3 lg:col-span-2 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-3 flex items-center gap-1">
                        <ShoppingBag size={13} />
                        <span>Prendas Adquiridas ({order.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0})</span>
                      </h4>
                      
                      <div className="divide-y divide-gray-50 max-h-40 overflow-y-auto pr-2 space-y-2.5">
                        {order.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 pt-2.5 first:pt-0">
                            {item.imageUrl && (
                              <div className="w-10 h-12 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-xs font-bold text-gray-900 leading-tight">{item.productName}</p>
                              <p className="text-[10px] text-gray-400 font-medium">Talla: {item.size} · Color: {item.color} · Cantidad: x{item.quantity}</p>
                            </div>
                            <span className="text-xs font-black text-gray-900">S/ {(item.unitPrice * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer / Totals Row */}
                    <div className="border-t border-gray-100 pt-4 flex flex-wrap justify-between items-center gap-4 bg-gray-50/20 -mx-8 -mb-8 px-8 py-4">
                      <div className="flex gap-6 text-xs text-gray-500">
                        <div>Subtotal: <strong className="text-gray-700">S/ {parseFloat(order.subtotal).toFixed(2)}</strong></div>
                        <div>Envío: <strong className="text-gray-700">S/ {parseFloat(order.shippingCost).toFixed(2)}</strong></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Recaudado:</span>
                        <span className="text-lg font-black text-[#8B5A5A]">S/ {parseFloat(order.total).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
