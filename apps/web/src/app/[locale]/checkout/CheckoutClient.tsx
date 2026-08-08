'use client';
import { useState, useEffect } from 'react';

declare global {
  interface Window {
    Culqi: any;
    culqi: any;
  }
}
import Script from 'next/script';
import Link from 'next/link';
import { ArrowRight, MapPin, Package, User, IdCard } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

function buildTimeline(region: string) {
  const isLima = region.toLowerCase().includes('lima') || region === 'Cotizando...';
  const province = !isLima;
  const steps = [
    { label: 'Pedido Recibido', key: 'received' },
    { label: 'Pago Confirmado', key: 'payment' },
    { label: 'En Preparación', key: 'preparing' },
    { label: 'Enviado con Transportista', key: 'shipped' },
    ...(province ? [{ label: `En Camino a ${region}`, key: 'enroute' }] : []),
    { label: province ? `Entregado en ${region}` : 'Entregado en tu domicilio', key: 'delivered' },
  ];
  return steps;
}

export type CheckoutProfile = {
  email: string;
  name: string;
  dni: string;
  phone: string;
};

export default function CheckoutClient({ profile }: { profile: CheckoutProfile }) {
  const { items, clearCart } = useCartStore();
  const [step, setStep] = useState<'auth' | 'shipping' | 'confirm' | 'done'>('auth');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<null | { name: string; email: string; dni: string }>(null);
  // El carrito se vacía al confirmar, así que el número y el total del pedido
  // se guardan para poder mostrarlos en la pantalla final.
  const [lastOrderNumber, setLastOrderNumber] = useState<string | null>(null);
  const [lastOrderTotal, setLastOrderTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [destinations, setDestinations] = useState<any[]>([]);
  const [loadingDestinations, setLoadingDestinations] = useState(true);

  // Métodos de pago habilitados por el administrador desde el panel.
  // Nunca se guarda ni se muestra el número de Yape del negocio: la clienta
  // paga escaneando el QR, y el WhatsApp sólo se usa para enviar la captura.
  const [paymentConfig, setPaymentConfig] = useState({
    paymentCardEnabled: true,
    paymentYapeEnabled: true,
    paymentManualEnabled: false,
    yapeQrUrl: '',
    whatsappNumber: '',
    manualPaymentInfo: '',
  });

  // Los datos llegan resueltos desde el servidor (la página ya validó la
  // sesión), así el formulario nace lleno y no hay que volver a pedirlos.
  const [form, setForm] = useState({
    email: profile.email,
    name: profile.name,
    dni: profile.dni,
    address: '',
    // El destino se elige en dos pasos: primero la zona (Lima o Provincia),
    // luego el destino puntual dentro de esa zona. Antes era un único combo
    // gigante con todos los distritos y agencias mezclados.
    destinationType: '' as '' | 'LIMA_METROPOLITANA' | 'PROVINCIA' | 'OTHER',
    destinationId: '',
    missingDestinationName: '',
    phone: profile.phone,
    paymentMethod: '',
    notes: '',
  });

  useEffect(() => {
    // Definir callback global para Culqi
    window.culqi = async () => {
      if (window.Culqi.token) {
        const token = window.Culqi.token.id;
        await processOrder(token, null);
      } else if (window.Culqi.order) {
        const orderId = window.Culqi.order;
        // Si el pago es por Yape, Culqi v4 devuelve window.Culqi.order
        await processOrder(null, orderId);
      } else {
        setError(window.Culqi.error?.user_message || 'Error al procesar el pago');
        setLoading(false);
      }
    };
  }, []);

  const getApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
      return `http://${hostname}:4000/api/v1`;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1';
  };

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/shipping/destinations?active=true`)
      .then(res => res.json())
      .then(data => setDestinations(data || []))
      .catch(() => setDestinations([]))
      .finally(() => setLoadingDestinations(false));
  }, []);

  // Cargar qué métodos de pago están activos en la tienda
  useEffect(() => {
    fetch(`${getApiBaseUrl()}/stores`)
      .then(res => res.json())
      .then(data => {
        const config = {
          paymentCardEnabled: data?.paymentCardEnabled ?? true,
          paymentYapeEnabled: data?.paymentYapeEnabled ?? true,
          paymentManualEnabled: data?.paymentManualEnabled ?? false,
          yapeQrUrl: data?.yapeQrUrl || '',
          whatsappNumber: data?.whatsappNumber || '',
          manualPaymentInfo: data?.manualPaymentInfo || '',
        };
        setPaymentConfig(config);
        // Preseleccionar el primer método disponible
        const first = config.paymentCardEnabled
          ? 'tarjeta'
          : config.paymentYapeEnabled
            ? 'yape'
            : config.paymentManualEnabled
              ? 'transferencia'
              : '';
        setForm(f => (f.paymentMethod ? f : { ...f, paymentMethod: first }));
      })
      .catch(() => {
        // Si no se puede leer la config, se asume el default seguro (sólo Culqi)
        setForm(f => (f.paymentMethod ? f : { ...f, paymentMethod: 'tarjeta' }));
      });
  }, []);

  const paymentOptions = [
    paymentConfig.paymentCardEnabled && {
      value: 'tarjeta',
      label: 'Tarjeta de Crédito o Débito',
      hint: 'Pago inmediato y seguro con Culqi.',
    },
    paymentConfig.paymentYapeEnabled && {
      value: 'yape',
      label: 'Yape',
      hint: 'Escanea el QR desde tu app de Yape. Monto mínimo S/ 6.00.',
    },
    paymentConfig.paymentManualEnabled && {
      value: 'transferencia',
      label: 'Yape con QR',
      hint: 'Escanea nuestro QR, paga y envíanos la captura por WhatsApp.',
    },
  ].filter(Boolean) as { value: string; label: string; hint: string }[];

  // Mensaje prellenado para que la clienta solo adjunte su captura.
  const whatsappUrl = (orderNumber?: string, amount?: number) => {
    const texto = encodeURIComponent(
      `Hola! Acabo de yapear mi pedido${orderNumber ? ` ${orderNumber}` : ''} por S/ ${(amount ?? grandTotal).toFixed(2)}. Adjunto mi captura.`,
    );
    return `https://wa.me/51${paymentConfig.whatsappNumber}?text=${texto}`;
  };

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  
  const selectedDestination = destinations.find(d => d.id === form.destinationId);
  const isOther = form.destinationType === 'OTHER';
  const destinationsInZone = destinations.filter(d => d.type === form.destinationType);
  
  const shipping = isOther ? 0 : (selectedDestination ? Number(selectedDestination.price) : 0);
  const grandTotal = total + shipping;
  const deliveryTime = selectedDestination?.estimatedDays || 'Pendiente';

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('Ingresa tu nombre completo.');
      return;
    }
    if (!/^\d{8}$/.test(form.dni)) {
      setError('El DNI debe tener exactamente 8 dígitos.');
      return;
    }

    setUser({ name: form.name, email: form.email, dni: form.dni });
    setStep('shipping');
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.address.trim()) {
      setError('Ingresa tu dirección completa para poder entregarte el pedido.');
      return;
    }
    if (!form.destinationType) {
      setError('Selecciona a dónde quieres tu envío: Lima o Provincia.');
      return;
    }
    if (!isOther && !form.destinationId) {
      setError('Selecciona tu distrito o agencia de destino.');
      return;
    }
    if (isOther && !form.missingDestinationName.trim()) {
      setError('Indícanos a qué ciudad o distrito deseas el envío.');
      return;
    }
    if (!/^\d{9}$/.test(form.phone)) {
      setError('El teléfono debe tener exactamente 9 dígitos.');
      return;
    }
    // El envío a provincia se recoge en agencia y ahí piden documento de identidad.
    if (selectedDestination?.type === 'PROVINCIA' && !/^\d{8}$/.test(form.dni)) {
      setError('Para recoger en agencia necesitamos tu DNI (8 dígitos). Vuelve al paso anterior para completarlo.');
      return;
    }
    if (!form.paymentMethod) {
      setError('Elige un método de pago.');
      return;
    }

    setStep('confirm');
  };

  const processOrder = async (culqiToken: string | null, culqiOrderId: string | null) => {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1';
      
      const payload = {
        email: form.email,
        name: form.name || 'Cliente Phalay',
        dni: form.dni || null,
        address: form.address,
        shippingDestinationId: isOther ? null : form.destinationId,
        missingDestinationName: isOther ? form.missingDestinationName : null,
        phone: form.phone,
        paymentMethod: form.paymentMethod,
        notes: form.notes,
        culqiToken,
        culqiOrderId,
        items: items.map(item => ({
          productId: item.id,
          variantId: item.variantId || null,
          name: item.name,
          sku: item.id.substring(0, 8).toUpperCase(),
          imageUrl: item.imageUrl,
          quantity: item.quantity,
          price: item.price,
          size: item.size,
          color: item.color,
        })),
        subtotal: total,
        shippingCost: shipping,
        total: grandTotal,
      };

      const res = await fetch(`${apiBaseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || 'Error al procesar el pedido.');
        setLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Guardamos número y total (calculados por el servidor) antes de vaciar
      // el carrito, para el mensaje de WhatsApp y la pantalla de confirmación.
      const created = await res.json().catch(() => null);
      if (created?.order?.orderNumber) {
        setLastOrderNumber(created.order.orderNumber);
      }
      setLastOrderTotal(Number(created?.order?.total ?? grandTotal));

      clearCart();
      setStep('done');
    } catch (error) {
      setError('Error de conexión al procesar tu pedido. Por favor intenta de nuevo.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setLoading(false);
  };

  const CULQI_STYLE = {
    bannerColor: '#000000',
    buttonBackground: '#000000',
    buttonText: '#ffffff',
    linksColor: '#000000',
    priceColor: '#000000',
  };

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);

    const isCulqi = form.paymentMethod === 'tarjeta' || form.paymentMethod === 'yape';

    if (!isCulqi) {
      // Flujo de transferencia manual: la orden queda PENDIENTE de confirmación
      await processOrder(null, null);
      return;
    }

    if (typeof window === 'undefined' || !window.Culqi) {
      setError('La pasarela de pagos no cargó correctamente. Recarga la página e intenta de nuevo.');
      setLoading(false);
      return;
    }

    try {
      const apiBaseUrl = getApiBaseUrl();
      const cartPayload = {
        items: items.map(item => ({
          productId: item.id,
          variantId: item.variantId || null,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        })),
        shippingDestinationId: isOther ? null : form.destinationId || null,
      };

      window.Culqi.publicKey = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY;

      if (form.paymentMethod === 'yape') {
        // Yape requiere una Orden de Culqi (sujeta al monto mínimo de S/ 6.00).
        const res = await fetch(`${apiBaseUrl}/payments/culqi-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...cartPayload,
            email: form.email,
            name: form.name,
            phone: form.phone,
          }),
        });
        const data = await res.json();

        if (!res.ok || !data.orderId) {
          // Se muestra el motivo real devuelto por la API/Culqi
          throw new Error(data.message || 'No se pudo generar la orden de pago.');
        }

        window.Culqi.settings({
          title: 'PHALAY',
          currency: 'PEN',
          amount: Math.round(data.amount * 100),
          order: data.orderId,
        });
        window.Culqi.options({
          lang: 'auto',
          modal: true,
          paymentMethods: { tarjeta: false, yape: true, bancaMovil: false, agente: false, cuotealo: false },
          style: CULQI_STYLE,
        });
      } else {
        // Tarjeta: no necesita Orden, sólo el monto — así no aplica el mínimo
        // de S/ 6.00 que Culqi exige para las Órdenes de Yape.
        const res = await fetch(`${apiBaseUrl}/payments/quote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...cartPayload, method: 'tarjeta' }),
        });
        const data = await res.json();

        if (!res.ok || typeof data.total !== 'number') {
          throw new Error(data.message || 'No se pudo calcular el total del pedido.');
        }

        window.Culqi.settings({
          title: 'PHALAY',
          currency: 'PEN',
          amount: Math.round(data.total * 100),
        });
        window.Culqi.options({
          lang: 'auto',
          modal: true,
          paymentMethods: { tarjeta: true, yape: false, bancaMovil: false, agente: false, cuotealo: false },
          style: CULQI_STYLE,
        });
      }

      window.Culqi.open();
      // setLoading(false) ocurre en el callback window.culqi
    } catch (e: any) {
      setError(e.message || 'Ocurrió un error al conectar con la pasarela de pagos.');
      setLoading(false);
    }
  };

  const timeline = buildTimeline(isOther ? 'Cotizando...' : selectedDestination?.department || selectedDestination?.district || 'Lima');

  if (items.length === 0 && step !== 'done') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#F8F8F8]">
        <p className="text-gray-500 mb-6">Tu bolsa está vacía.</p>
        <Link href="/catalogo" className="bg-black text-white px-8 py-3 text-sm font-bold tracking-widest uppercase">
          Explorar Catálogo
        </Link>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#F8F8F8] text-center px-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <Package size={36} className="text-green-600" />
        </div>
        <h1 className="text-3xl font-serif text-gray-900 mb-3">¡Pedido Confirmado!</h1>
        <p className="text-gray-500 mb-2 max-w-md">
          Gracias por tu compra, <strong>{user?.name}</strong>. Recibirás confirmación en <strong>{user?.email}</strong>.
        </p>
        {selectedDestination && selectedDestination.type === 'PROVINCIA' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-6 py-3 rounded-xl mb-6 max-w-md">
            📦 Tu pedido llegará a <strong>{selectedDestination.department}</strong> en aproximadamente <strong>{deliveryTime}</strong> por {selectedDestination.agencyName}.
          </div>
        )}
        {isOther && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 text-sm px-6 py-3 rounded-xl mb-6 max-w-md">
            ⚠️ Estamos cotizando el envío a <strong>{form.missingDestinationName}</strong>. Te contactaremos pronto.
          </div>
        )}

        {/* Pago por Yape directo: recordamos el QR y damos el botón para
            mandar la captura, que es lo que permite aprobar el pedido. Este
            es el QR que la clienta realmente escanea para pagar, así que
            necesita verse grande y nítido — no es sólo una vista previa. */}
        {form.paymentMethod === 'transferencia' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 mb-6 max-w-lg w-full">
            <p className="font-bold text-gray-900 mb-1">Falta un paso: envíanos tu captura</p>
            <p className="text-sm text-gray-500 mb-5">
              Escanea el QR y yapea <strong className="text-gray-900">S/ {lastOrderTotal.toFixed(2)}</strong>. Luego
              mándanos la captura por WhatsApp para confirmar tu pedido.
            </p>

            {paymentConfig.yapeQrUrl && (
              <a
                href={paymentConfig.yapeQrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block mb-2"
                title="Ver el QR en tamaño completo"
              >
                <img
                  src={paymentConfig.yapeQrUrl}
                  alt="Código QR de Yape"
                  className="w-64 h-64 sm:w-72 sm:h-72 object-contain mx-auto bg-white border border-gray-200 p-3 shadow-sm group-hover:border-gray-400 transition-colors"
                />
              </a>
            )}
            <p className="text-xs text-center text-gray-400 mb-5">Toca el código para verlo en pantalla completa</p>

            {paymentConfig.whatsappNumber && (
              <a
                href={whatsappUrl(lastOrderNumber || undefined, lastOrderTotal)}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-[#25D366] hover:bg-[#1FB855] text-white py-3.5 text-sm font-bold tracking-widest uppercase transition-colors rounded-xl"
              >
                Enviar captura por WhatsApp
              </a>
            )}
          </div>
        )}

        <div className="flex gap-4">
          <Link href="/mis-pedidos" className="bg-black text-white px-8 py-3 text-sm font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors">
            Ver Mis Pedidos
          </Link>
          <Link href="/" className="border border-gray-300 text-gray-700 px-8 py-3 text-sm font-bold tracking-widest uppercase hover:border-gray-900 transition-colors">
            Seguir Comprando
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] py-8 sm:py-12">
      <Script src="https://checkout.culqi.com/js/v4" strategy="afterInteractive" />
      {/* Contenedor más ancho para aprovechar pantallas grandes (antes 1100px
          dejaba mucho margen vacío en monitores de escritorio), con padding
          progresivo para que en mobile el contenido no llegue al borde. */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <h1 className="text-3xl font-serif text-gray-900 mb-2">Finalizar Compra</h1>

        {/* Steps: flex-wrap evita que se corten o superpongan en pantallas
            angostas de celular. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-10 text-xs font-bold uppercase tracking-widest">
          {(['auth', 'shipping', 'confirm'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors flex-shrink-0 ${
                step === s ? 'bg-black text-white' :
                ['auth','shipping','confirm'].indexOf(step) > i ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>{i + 1}</span>
              <span className={step === s ? 'text-gray-900' : 'text-gray-400'}>
                {s === 'auth' ? 'Cuenta' : s === 'shipping' ? 'Envío' : 'Confirmar'}
              </span>
              {i < 2 && <span className="text-gray-300 hidden sm:inline">—</span>}
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          {/* max-w evita que los campos del formulario queden absurdamente
              anchos en monitores grandes; el espacio extra del contenedor
              se reparte como aire alrededor, no estirando los inputs. */}
          <div className="flex-1 max-w-2xl w-full">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6 animate-fade-in">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse mt-1.5 flex-shrink-0"></span>
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                  <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 font-bold text-lg select-none px-2 cursor-pointer">
                    &times;
                  </button>
                </div>
                {/* Si el carrito quedó desactualizado (producto eliminado del
                    catálogo), ofrecemos vaciarlo para poder continuar. */}
                {/ya no está disponible/i.test(error) && (
                  <button
                    onClick={() => { clearCart(); setError(null); }}
                    className="mt-3 ml-5 text-xs font-bold uppercase tracking-widest underline hover:text-red-900"
                  >
                    Vaciar mi bolsa
                  </button>
                )}
              </div>
            )}

            {/* DATOS DE CONTACTO */}
            {step === 'auth' && (
              <div className="bg-white border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-2">
                  <User size={20} className="text-gray-400" />
                  <h2 className="text-xl font-bold text-gray-900">Tus datos de contacto</h2>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  Los usaremos para confirmarte el pedido y coordinar la entrega.
                </p>

                {/* La compra requiere cuenta, así que el correo viene de la
                    sesión y no se edita: es la identidad del pedido. */}
                <div className="flex items-center gap-3 bg-green-50 border border-green-100 px-4 py-3 mb-5 text-sm">
                  <User size={16} className="text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">
                    Comprando como <strong className="text-gray-900">{form.email}</strong>
                  </span>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-1">Nombre Completo</label>
                    <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-900"
                      placeholder="María García Ramos" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-1">
                      DNI
                    </label>
                    <div className="relative">
                      <IdCard size={16} className="absolute left-4 top-3.5 text-gray-400" />
                      <input
                        required
                        type="text"
                        inputMode="numeric"
                        maxLength={8}
                        pattern="\d{8}"
                        value={form.dni}
                        onChange={e => setForm({ ...form, dni: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                        className="w-full border border-gray-200 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-gray-900"
                        placeholder="12345678"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">8 dígitos. Lo necesitamos para emitir tu comprobante y para recoger en agencia.</p>
                  </div>
                  <button type="submit"
                    className="w-full bg-black hover:bg-gray-800 text-white py-4 font-bold tracking-widest uppercase transition-colors">
                    Continuar al Envío
                  </button>
                </form>
              </div>
            )}

            {/* SHIPPING STEP */}
            {step === 'shipping' && (
              <div className="bg-white border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin size={20} className="text-gray-400" />
                  <h2 className="text-xl font-bold text-gray-900">Dirección de Envío</h2>
                </div>
                <div className="flex items-center gap-2 mb-6 bg-green-50 border border-green-200 px-4 py-3 rounded text-sm text-green-700">
                  <User size={16} />
                  Hola, <strong>{user?.name}</strong> — {user?.email}
                </div>
                <form onSubmit={handleShippingSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-1">Dirección Completa</label>
                    <input required type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                      className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-900"
                      placeholder="Av. Larco 1234, Miraflores" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-1">Zona de Envío</label>
                      <select
                        required
                        value={form.destinationType}
                        onChange={e => setForm({
                          ...form,
                          destinationType: e.target.value as typeof form.destinationType,
                          // Al cambiar de zona, el destino puntual elegido antes ya no aplica.
                          destinationId: '',
                        })}
                        className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-900 bg-white disabled:bg-gray-100"
                        disabled={loadingDestinations}
                      >
                        <option value="">{loadingDestinations ? 'Cargando...' : 'Selecciona...'}</option>
                        <option value="LIMA_METROPOLITANA">Lima Metropolitana (Delivery)</option>
                        <option value="PROVINCIA">Envío a Provincia (Agencia)</option>
                        <option value="OTHER">No encuentro mi destino</option>
                      </select>
                    </div>

                    {/* Sólo aparece tras elegir la zona, y sólo lista los
                        destinos de esa zona — ya no un combo gigante mezclado. */}
                    {(form.destinationType === 'LIMA_METROPOLITANA' || form.destinationType === 'PROVINCIA') && (
                      <div className="animate-fade-in">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-1">
                          {form.destinationType === 'LIMA_METROPOLITANA' ? 'Distrito' : 'Agencia / Provincia'}
                        </label>
                        <select
                          required
                          value={form.destinationId}
                          onChange={e => setForm({ ...form, destinationId: e.target.value })}
                          className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-900 bg-white"
                        >
                          <option value="">Selecciona...</option>
                          {destinationsInZone.map(d => (
                            <option key={d.id} value={d.id}>
                              {form.destinationType === 'LIMA_METROPOLITANA'
                                ? `${d.district} — S/ ${Number(d.price).toFixed(2)}`
                                : `${d.department}, ${d.province} (${d.agencyName}) — S/ ${Number(d.price).toFixed(2)}`}
                            </option>
                          ))}
                          {destinationsInZone.length === 0 && !loadingDestinations && (
                            <option value="" disabled>No hay destinos configurados en esta zona</option>
                          )}
                        </select>
                      </div>
                    )}
                  </div>

                  {isOther && (
                    <div className="bg-orange-50 border border-orange-200 p-4 rounded animate-fade-in">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-1 text-orange-900">¿A dónde deseas el envío?</label>
                      <input required type="text" value={form.missingDestinationName} onChange={e => setForm({ ...form, missingDestinationName: e.target.value })}
                        className="w-full border border-orange-200 px-4 py-3 text-sm focus:outline-none focus:border-orange-500 mb-2"
                        placeholder="Ej. Cajamarca - Chota" />
                      <p className="text-xs text-orange-800">
                        Te contactaremos para cotizar el costo de envío a este destino. Podrás pagar el envío después de que confirmemos la cobertura.
                      </p>
                    </div>
                  )}

                  {/* Dynamic shipping notice */}
                  {selectedDestination && (
                    <div className={`flex items-start gap-3 p-4 rounded text-sm ${selectedDestination.type === 'LIMA_METROPOLITANA' ? 'bg-blue-50 border border-blue-100 text-blue-700' : 'bg-amber-50 border border-amber-100 text-amber-700'}`}>
                      <Package size={16} className="flex-shrink-0 mt-0.5" />
                      <div>
                        {selectedDestination.type === 'LIMA_METROPOLITANA' ? (
                          <><strong>Lima ({selectedDestination.district}):</strong> Envío en {selectedDestination.estimatedDays || '2-3 días hábiles'} · Costo: S/ {Number(selectedDestination.price).toFixed(2)}</>
                        ) : (
                          <><strong>Provincia ({selectedDestination.department}):</strong> Envío en {selectedDestination.estimatedDays || '5-8 días hábiles'} vía {selectedDestination.agencyName} · Costo: S/ {Number(selectedDestination.price).toFixed(2)}<br/>
                          <span className="text-[12px] mt-1 block opacity-80">Se requiere DNI para la recepción del paquete en agencia.</span></>
                        )}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-1">Teléfono / WhatsApp</label>
                    <input
                      required
                      type="tel"
                      inputMode="numeric"
                      maxLength={9}
                      pattern="\d{9}"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                      className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-900"
                      placeholder="999888777" />
                    <p className="text-[11px] text-gray-400 mt-1">9 dígitos, sin espacios ni +51.</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-1">Método de Pago</label>
                    <div className="space-y-2">
                      {paymentOptions.length === 0 && (
                        <p className="text-sm text-red-600 bg-red-50 px-4 py-3">
                          No hay métodos de pago disponibles en este momento. Contáctanos para completar tu compra.
                        </p>
                      )}
                      {paymentOptions.map(opt => (
                        <label key={opt.value} className="flex items-start gap-3 cursor-pointer border border-gray-200 px-4 py-3 hover:border-gray-900 transition-colors has-[:checked]:border-black has-[:checked]:bg-gray-50">
                          <input type="radio" name="payment" value={opt.value} required
                            checked={form.paymentMethod === opt.value}
                            onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                            className="accent-black mt-0.5" />
                          <span>
                            <span className="text-sm text-gray-900 block">{opt.label}</span>
                            <span className="text-xs text-gray-500 block mt-0.5">{opt.hint}</span>
                          </span>
                        </label>
                      ))}
                    </div>

                    {/* Se explica dónde se ingresan los datos de pago para que no
                        parezca que falta un paso en este formulario. */}
                    {form.paymentMethod === 'tarjeta' && (
                      <p className="text-xs text-gray-500 mt-3 bg-gray-50 border border-gray-100 px-4 py-3">
                        En el último paso se abrirá la ventana segura de Culqi donde ingresarás los datos de tu tarjeta.
                        Nunca guardamos esa información.
                      </p>
                    )}
                    {form.paymentMethod === 'yape' && (
                      <p className="text-xs text-gray-500 mt-3 bg-gray-50 border border-gray-100 px-4 py-3">
                        En el último paso se abrirá la ventana de Culqi con el código QR para que pagues desde tu app de Yape.
                      </p>
                    )}
                    {form.paymentMethod === 'transferencia' && (
                      <div className="mt-3 bg-gray-50 border border-gray-100 px-4 py-5 sm:px-6">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-700 mb-4">
                          Yapea S/ {grandTotal.toFixed(2)} y guarda tu captura
                        </p>
                        <div className="flex flex-col sm:flex-row gap-5 items-center">
                          {paymentConfig.yapeQrUrl && (
                            <a
                              href={paymentConfig.yapeQrUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 group"
                              title="Ver el QR en tamaño completo"
                            >
                              <img
                                src={paymentConfig.yapeQrUrl}
                                alt="Código QR de Yape"
                                className="w-48 h-48 sm:w-52 sm:h-52 object-contain bg-white border border-gray-200 p-2 shadow-sm group-hover:border-gray-400 transition-colors"
                              />
                              <p className="text-[11px] text-center text-gray-400 mt-1.5 group-hover:text-gray-600">
                                Toca para ampliar
                              </p>
                            </a>
                          )}
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Escanea el QR desde tu app de Yape para pagar.</p>
                            <p>Al confirmar tu pedido te daremos el botón para enviarnos la captura por WhatsApp.</p>
                            {paymentConfig.manualPaymentInfo && (
                              <p className="text-xs text-gray-500 pt-1">{paymentConfig.manualPaymentInfo}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-700 block mb-1">Notas (opcional)</label>
                    <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                      className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-900 h-20 resize-none"
                      placeholder="Referencias de tu dirección, instrucciones para el repartidor..." />
                  </div>
                  <button type="submit"
                    className="w-full bg-black hover:bg-gray-800 text-white py-4 font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-2">
                    Revisar Pedido <ArrowRight size={16} />
                  </button>
                </form>
              </div>
            )}

            {/* CONFIRM STEP */}
            {step === 'confirm' && (
              <div className="bg-white border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Confirma tu Pedido</h2>
                <div className="bg-gray-50 p-5 rounded mb-6 text-sm space-y-1">
                  <p className="font-bold text-gray-900 mb-3">Resumen de Envío</p>
                  <p className="text-gray-600">{form.address}</p>
                  <p className="text-gray-600">Destino: <strong>{isOther ? form.missingDestinationName : selectedDestination ? (selectedDestination.type === 'LIMA_METROPOLITANA' ? selectedDestination.district : `${selectedDestination.department}, ${selectedDestination.province} - ${selectedDestination.agencyName}`) : ''}</strong></p>
                  <p className="text-gray-600">{form.phone}</p>
                  <p className="text-gray-600 mt-2">Pago: <span className="font-medium capitalize">{form.paymentMethod}</span></p>
                  <div className={`mt-3 p-3 rounded text-xs ${selectedDestination?.type === 'PROVINCIA' ? 'bg-amber-50 text-amber-700' : isOther ? 'bg-orange-50 text-orange-800' : 'bg-blue-50 text-blue-700'}`}>
                    🕐 Entrega estimada: <strong>{deliveryTime}</strong> · Envío: <strong>{isOther ? 'Por Cotizar' : `S/ ${shipping.toFixed(2)}`}</strong>
                    {selectedDestination?.type === 'PROVINCIA' && <><br/>📋 DNI a presentar: <strong>{user?.dni}</strong></>}
                  </div>
                </div>

                {/* Vista previa del recorrido del pedido. Se usa una lista
                    vertical (en vez de una fila con scroll horizontal) para
                    que nunca queden pasos cortados ni haga falta desplazar,
                    tanto en mobile como en desktop. */}
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-4">Tu Pedido Seguirá Este Camino:</p>
                  <div>
                    {timeline.map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                            {i + 1}
                          </div>
                          {i < timeline.length - 1 && (
                            <div className="w-[2px] flex-1 min-h-[20px] bg-gray-200" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 pt-1 pb-4">{step.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={handleConfirm} disabled={loading}
                  className="w-full bg-black hover:bg-gray-800 text-white py-4 font-bold tracking-widest uppercase transition-colors disabled:opacity-50">
                  {loading
                    ? 'Procesando pedido...'
                    : form.paymentMethod === 'tarjeta'
                      ? `Pagar S/ ${grandTotal.toFixed(2)} con Tarjeta`
                      : form.paymentMethod === 'yape'
                        ? `Pagar S/ ${grandTotal.toFixed(2)} con Yape`
                        : '✓ Confirmar Pedido'}
                </button>
                <button onClick={() => setStep('shipping')} className="w-full mt-3 text-sm text-gray-500 hover:text-black underline">
                  ← Editar dirección
                </button>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar: ancho fijo en desktop (no crece sin
              límite con el contenedor), ocupa el resto del espacio como
              margen respirable en vez de estirar la tarjeta de resumen. */}
          <div className="w-full lg:w-[400px] flex-shrink-0">
            <div className="bg-white border border-gray-100 p-6 lg:sticky lg:top-28">
              <h2 className="font-bold text-gray-900 mb-4">Tu Pedido ({items.reduce((s,i) => s + i.quantity, 0)} {items.reduce((s,i) => s + i.quantity, 0) === 1 ? 'prenda' : 'prendas'})</h2>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="flex gap-3 text-sm">
                    <div className="w-12 h-16 bg-gray-100 overflow-hidden flex-shrink-0">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-xs">{item.name}</p>
                      <p className="text-gray-400 text-[11px]">{item.size} · {item.color} · x{item.quantity}</p>
                      <p className="font-bold text-gray-900 text-xs mt-1">S/ {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>S/ {total.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-500">
                  <span>Envío {isOther ? '(Por cotizar)' : selectedDestination ? (selectedDestination.type === 'PROVINCIA' ? `(${selectedDestination.department})` : '(Lima)') : ''}</span>
                  <span>{isOther ? 'S/ 0.00' : `S/ ${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                  <span>Total</span><span>S/ {grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
