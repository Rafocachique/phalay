'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Truck, CheckCircle2, Clock, MapPin, Search, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/** Cómo va el pago, para que la clienta sepa si aún falta validarlo. */
const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'Pago por confirmar',  color: 'bg-amber-100 text-amber-700' },
  COMPLETED: { label: 'Pago confirmado',     color: 'bg-green-100 text-green-700' },
  FAILED:    { label: 'Pago no verificado',  color: 'bg-red-100 text-red-700' },
  REFUNDED:  { label: 'Reembolsado',         color: 'bg-gray-100 text-gray-600' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:    { label: 'Pendiente',       color: 'bg-yellow-100 text-yellow-700',  icon: <Clock size={13} /> },
  CONFIRMED:  { label: 'Confirmado',      color: 'bg-indigo-100 text-indigo-700',   icon: <CheckCircle2 size={13} /> },
  PROCESSING: { label: 'En Preparación',  color: 'bg-blue-100 text-blue-700',      icon: <Package size={13} /> },
  SHIPPED:    { label: 'En Camino',       color: 'bg-purple-100 text-purple-700',  icon: <Truck size={13} /> },
  DELIVERED:  { label: 'Entregado',       color: 'bg-green-100 text-green-700',    icon: <CheckCircle2 size={13} /> },
  CANCELLED:  { label: 'Cancelado',       color: 'bg-red-100 text-red-700',        icon: <Clock size={13} /> },
};

export default function MisPedidosPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [orderNumberInput, setOrderNumberInput] = useState('');
  const [activeEmail, setActiveEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  // Con sesión iniciada se muestra el historial completo sin buscar nada.
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(async ({ data }) => {
      const session = data?.session;
      if (!session) {
        setIsLoggedIn(false);
        return;
      }

      setIsLoggedIn(true);
      setLoading(true);
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1';
        const res = await fetch(`${apiBaseUrl}/orders/mine`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: 'no-store',
        });
        if (res.ok) {
          setOrders(await res.json());
        } else {
          setSearchError('No pudimos cargar tus pedidos. Intenta nuevamente.');
        }
      } catch {
        setSearchError('Error de conexión al cargar tus pedidos.');
      }
      setLoading(false);
      setSearched(true);
    });
  }, []);

  // El seguimiento de pedidos requiere email + número de pedido exactos:
  // así nadie puede listar el historial completo de otra persona sólo
  // adivinando o conociendo su correo.
  async function fetchOrder(email: string, orderNumber: string) {
    setLoading(true);
    setSearchError(null);
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1';
      const params = new URLSearchParams({ email, orderNumber });
      const res = await fetch(`${apiBaseUrl}/orders/track?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setOrders([data]);
      } else {
        setOrders([]);
        setSearchError('No encontramos un pedido con ese correo y número de pedido.');
      }
    } catch (e) {
      console.error('Error fetching order:', e);
      setOrders([]);
      setSearchError('Error de conexión al buscar tu pedido.');
    }
    setLoading(false);
  }

  const displayedOrders = orders;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveEmail(emailInput.trim());
    setSearched(true);
    fetchOrder(emailInput.trim(), orderNumberInput.trim());
  };

  const handleClearFilter = () => {
    setEmailInput('');
    setOrderNumberInput('');
    setActiveEmail('');
    setSearched(false);
    setSearchError(null);
    setOrders([]);
  };

  // Build real-time order timeline
  function buildTimeline(status: string, region: string, agencyName?: string) {
    const isLima = region?.toLowerCase().includes('lima');
    const deliveryPlace = isLima ? 'en Lima' : `en ${region || 'Provincia'}`;

    // Status hierarchy index to determine done state
    const orderHierarchy = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const currentIndex = orderHierarchy.indexOf(status);

    return [
      { label: 'Pedido Recibido', done: currentIndex >= 0, detail: 'Orden registrada con éxito.' },
      { label: 'Pago Confirmado', done: currentIndex >= 1, detail: currentIndex >= 1 ? 'Transacción verificada.' : 'Esperando depósito.' },
      { label: 'En Preparación', done: currentIndex >= 2, detail: currentIndex >= 2 ? 'Prendas empacadas en taller.' : 'Pendiente.' },
      {
        label: 'Enviado con Transportista',
        done: currentIndex >= 3,
        // La agencia real viene del destino de envío configurado por la tienda.
        detail: currentIndex >= 3 ? (agencyName ? `Despachado con ${agencyName}.` : 'Pedido despachado.') : 'Pendiente.',
      },
      { label: `Entregado ${deliveryPlace}`, done: currentIndex >= 4, detail: currentIndex >= 4 ? '¡Tu paquete ha llegado!' : 'Fecha estimada.' },
    ];
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] py-12">
      <div className="max-w-[900px] mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-serif text-gray-900 mb-2">Mis Pedidos</h1>
            <p className="text-sm text-gray-500 font-medium">Consulta el estado y la ubicación en tiempo real de tus compras de Phalay.</p>
          </div>
        </div>

        {/* El buscador es sólo para quien compró sin cuenta: con sesión
            iniciada el historial se carga automáticamente. */}
        <div className={`bg-white border border-gray-100 p-6 rounded-2xl shadow-sm mb-8 ${isLoggedIn ? 'hidden' : ''}`}>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="email"
                required
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="Correo con el que compraste (ej. tu@email.com)"
                className="w-full bg-[#F8F9FA] border border-transparent rounded-xl pl-4 pr-12 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 text-sm transition-colors"
              />
              <Search size={18} className="absolute right-4 top-4 text-gray-400" />
            </div>
            <div className="relative flex-1">
              <input
                type="text"
                required
                value={orderNumberInput}
                onChange={e => setOrderNumberInput(e.target.value)}
                placeholder="Número de pedido (ej. PH-123456-789)"
                className="w-full bg-[#F8F9FA] border border-transparent rounded-xl pl-4 pr-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 text-sm transition-colors"
              />
            </div>
            <button
              type="submit"
              className="bg-black hover:bg-gray-800 text-white font-bold text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl transition-all"
            >
              Buscar Pedido
            </button>
          </form>

          {activeEmail ? (
            <div className="mt-3 flex items-center justify-between text-xs bg-[#FBEFEF] text-[#8B5A5A] px-4 py-2.5 rounded-lg font-bold">
              <span>Búsqueda: {activeEmail}</span>
              <button onClick={handleClearFilter} className="underline text-[11px] hover:text-[#6A3F3F]">
                Nueva búsqueda
              </button>
            </div>
          ) : (
            <div className="mt-3 text-xs text-blue-600 bg-blue-50 px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
              <span>💡 Ingresa el correo y el número de pedido que recibiste al finalizar tu compra.</span>
            </div>
          )}
          {searchError && (
            <div className="mt-3 text-xs text-red-600 bg-red-50 px-4 py-2.5 rounded-lg font-medium">
              {searchError}
            </div>
          )}
        </div>

        {loading ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#8B5A5A] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 text-xs mt-3 font-medium">Consultando base de datos...</p>
          </div>
        ) : !searched ? null : displayedOrders.length === 0 ? (
          <div className="bg-white border border-gray-100 p-16 rounded-2xl text-center shadow-sm">
            <Package size={52} className="text-gray-200 mx-auto mb-4" strokeWidth={1} />
            <p className="text-gray-500 mb-4 font-medium">
              {isLoggedIn
                ? 'Todavía no tienes pedidos. ¡Tu primera compra aparecerá aquí!'
                : 'No se encontraron pedidos para este criterio de búsqueda.'}
            </p>
            <Link href="/catalogo" className="bg-black text-white px-8 py-3 text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-gray-800 transition-colors">
              Explorar Catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {displayedOrders.map((order) => {
              const statusInfo = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
              const paymentInfo = PAYMENT_CONFIG[order.paymentStatus];
              const formattedDate = new Date(order.createdAt).toLocaleDateString('es-PE', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              });
              const timelineSteps = buildTimeline(
                order.status,
                order.address?.state,
                order.destination?.agencyName,
              );

              return (
                <div key={order.id} className="bg-white border border-gray-100 overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition-all">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-6 border-b border-gray-100 bg-gray-50/20">
                    <div>
                      <div className="flex items-center gap-3 mb-1.5">
                        <h2 className="font-mono font-bold text-gray-900 text-sm tracking-wider">{order.orderNumber}</h2>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${statusInfo.color}`}>
                          {statusInfo.icon} {statusInfo.label}
                        </span>
                        {/* Estado del pago: es lo que la clienta necesita ver
                            tras enviar su captura de Yape. */}
                        {paymentInfo && (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${paymentInfo.color}`}>
                            {order.paymentStatus === 'COMPLETED' ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                            {paymentInfo.label}
                          </span>
                        )}
                        {order.address?.state && !order.address.state.toLowerCase().includes('lima') && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-100">
                            <MapPin size={10} /> Provincia
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        Realizado el {formattedDate} · <strong className="text-gray-700">S/ {parseFloat(order.total).toFixed(2)}</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                      <MapPin size={13} className="text-gray-400" />
                      <span>{order.address?.street}, <strong>{order.address?.state}</strong></span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="p-6 border-b border-gray-100 space-y-3.5">
                    {order.items?.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-4">
                        {item.imageUrl && (
                          <div className="w-12 h-16 bg-gray-50 overflow-hidden flex-shrink-0 rounded-lg border border-gray-100">
                            <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-sm leading-snug">{item.productName}</p>
                          <p className="text-xs text-gray-400">Talla: {item.size} · Color: {item.color} · Cantidad: x{item.quantity}</p>
                        </div>
                        <span className="font-black text-gray-900 text-sm">S/ {parseFloat(item.unitPrice).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tracking Timeline */}
                  <div className="p-6 bg-gray-50/5">
                    <div className="flex items-center gap-2 mb-6">
                      <Truck size={15} className="text-gray-400" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Seguimiento del Envío
                        {order.destination?.agencyName && (
                          <span className="ml-2 font-normal normal-case text-gray-400">
                            · {order.destination.agencyName}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="relative">
                      {timelineSteps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-4 mb-6 last:mb-0">
                          {/* Dot + line */}
                          <div className="relative flex flex-col items-center">
                            <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-colors ${
                              step.done ? 'bg-[#8B5A5A] border-[#8B5A5A]' : 'bg-white border-gray-200'
                            }`} />
                            {idx < timelineSteps.length - 1 && (
                              <div className={`w-[2px] mt-1 ${
                                step.done && timelineSteps[idx+1].done ? 'bg-[#8B5A5A]' : 'bg-gray-200'
                              }`} style={{ height: '32px' }} />
                            )}
                          </div>
                          <div className="pb-1">
                            <p className={`text-xs font-bold leading-tight ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>
                              {step.label}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1 font-medium">{step.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
