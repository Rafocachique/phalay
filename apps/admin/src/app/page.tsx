import { getAuthHeader } from '@/lib/auth-header';
import Link from 'next/link';
import PlatformRevenueChart from '@/components/PlatformRevenueChart';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  try {
    const authHeaders = await getAuthHeader();
    
    const [usersRes, ordersRes, productsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/users`, { headers: authHeaders, cache: 'no-store' }),
      fetch(`${API_BASE_URL}/orders`, { headers: authHeaders, cache: 'no-store' }),
      fetch(`${API_BASE_URL}/products`, { headers: authHeaders, cache: 'no-store' }),
    ]);

    const usersData = usersRes.ok ? await usersRes.json() : { data: [] };
    const orders = ordersRes.ok ? await ordersRes.json() : [];
    const products = productsRes.ok ? await productsRes.json() : [];

    return {
      users: usersData.data || [],
      orders: orders || [],
      products: products || [],
    };
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    return { users: [], orders: [], products: [] };
  }
}

export default async function AdminDashboardPage() {
  const { users, orders } = await getDashboardData();

  // 1. Total de Usuarios
  const totalUsers = users.length;

  // 2. Pedidos Totales
  const totalOrders = orders.length;

  // 3. Ingresos Totales
  const completedOrders = orders.filter(
    (o: any) => o.paymentStatus === 'COMPLETED' || o.status === 'CONFIRMED' || o.status === 'DELIVERED'
  );
  const totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + Number(o.total), 0);

  // Format currency helper
  const formatCurrency = (val: number) => {
    if (val >= 1000000) {
      return `S/ ${(val / 1000000).toFixed(1)}M`;
    }
    if (val >= 1000) {
      return `S/ ${(val / 1000).toFixed(1)}k`;
    }
    return `S/ ${val.toFixed(2)}`;
  };



  // 5. Comparativa mes actual vs mes pasado
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const prevMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const prevMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const thisMonthOrders = orders.filter((o: any) => {
    const d = new Date(o.createdAt);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const prevMonthOrders = orders.filter((o: any) => {
    const d = new Date(o.createdAt);
    return d.getMonth() === prevMonth && d.getFullYear() === prevMonthYear;
  });

  // Pedidos diff
  let orderDiffText = 'Sin datos previos';
  let orderDiffColor = 'text-gray-500';
  if (prevMonthOrders.length > 0) {
    const diff = ((thisMonthOrders.length - prevMonthOrders.length) / prevMonthOrders.length) * 100;
    orderDiffText = `${diff >= 0 ? '↑' : '↓'} ${Math.abs(Math.round(diff))}% vs mes pasado`;
    orderDiffColor = diff >= 0 ? 'text-green-600' : 'text-red-600';
  } else if (thisMonthOrders.length > 0) {
    orderDiffText = 'Nuevo este mes';
    orderDiffColor = 'text-green-600';
  }

  // Ingresos diff
  const thisMonthRevenue = thisMonthOrders
    .filter((o: any) => o.paymentStatus === 'COMPLETED' || o.status === 'CONFIRMED' || o.status === 'DELIVERED')
    .reduce((sum: number, o: any) => sum + Number(o.total), 0);
  const prevMonthRevenue = prevMonthOrders
    .filter((o: any) => o.paymentStatus === 'COMPLETED' || o.status === 'CONFIRMED' || o.status === 'DELIVERED')
    .reduce((sum: number, o: any) => sum + Number(o.total), 0);

  let revDiffText = 'Sin datos previos';
  let revDiffColor = 'text-gray-500';
  if (prevMonthRevenue > 0) {
    const diff = ((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100;
    revDiffText = `${diff >= 0 ? '↑' : '↓'} ${Math.abs(Math.round(diff))}% vs mes pasado`;
    revDiffColor = diff >= 0 ? 'text-green-600' : 'text-red-600';
  } else if (thisMonthRevenue > 0) {
    revDiffText = 'Nuevo este mes';
    revDiffColor = 'text-green-600';
  }

  // Usuarios diff
  const thisMonthUsers = users.filter((u: any) => {
    const d = new Date(u.createdAt);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const prevMonthUsers = users.filter((u: any) => {
    const d = new Date(u.createdAt);
    return d.getMonth() === prevMonth && d.getFullYear() === prevMonthYear;
  });

  let userDiffText = 'Sin datos previos';
  let userDiffColor = 'text-gray-500';
  if (prevMonthUsers.length > 0) {
    const diff = ((thisMonthUsers.length - prevMonthUsers.length) / prevMonthUsers.length) * 100;
    userDiffText = `${diff >= 0 ? '↑' : '↓'} ${Math.abs(Math.round(diff))}% vs mes pasado`;
    userDiffColor = diff >= 0 ? 'text-green-600' : 'text-red-600';
  } else if (thisMonthUsers.length > 0) {
    userDiffText = 'Nuevo este mes';
    userDiffColor = 'text-green-600';
  }

  // 6. Ingresos mensuales para el gráfico (últimos 7 meses)
  const monthLabelsShort = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  const lastMonths: { label: string; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    lastMonths.push({
      label: monthLabelsShort[d.getMonth()],
      revenue: 0,
    });
  }

  orders.forEach((order: any) => {
    if (order.paymentStatus === 'COMPLETED' || order.status === 'CONFIRMED' || order.status === 'DELIVERED') {
      const date = new Date(order.createdAt);
      const m = date.getMonth();
      const y = date.getFullYear();
      const match = lastMonths.find(lm => lm.label === monthLabelsShort[m] && date.getFullYear() === y);
      if (match) {
        match.revenue += Number(order.total);
      }
    }
  });

  // Yearly data (last 5 years)
  const lastYears: { label: string; revenue: number }[] = [];
  const currentYear = now.getFullYear();
  for (let i = 4; i >= 0; i--) {
    lastYears.push({
      label: String(currentYear - i),
      revenue: 0,
    });
  }

  orders.forEach((order: any) => {
    if (order.paymentStatus === 'COMPLETED' || order.status === 'CONFIRMED' || order.status === 'DELIVERED') {
      const date = new Date(order.createdAt);
      const y = date.getFullYear();
      const match = lastYears.find(ly => ly.label === String(y));
      if (match) {
        match.revenue += Number(order.total);
      }
    }
  });

  // 7. Tasa de Conversión (Clientes compradores únicos vs total registrados)
  const uniqueBuyers = new Set(orders.map((o: any) => o.customerId)).size;
  const conversionRate = totalUsers > 0 ? ((uniqueBuyers / totalUsers) * 100).toFixed(1) : '0.0';
  const buyerRatioPercent = totalUsers > 0 ? Math.round((uniqueBuyers / totalUsers) * 100) : 0;

  // Tasa de conversión de este mes vs mes pasado (tendencia)
  const thisMonthUniqueBuyers = new Set(thisMonthOrders.map((o: any) => o.customerId)).size;
  const thisMonthConvRate = thisMonthUsers.length > 0 ? (thisMonthUniqueBuyers / thisMonthUsers.length) * 100 : 0;

  const prevMonthUniqueBuyers = new Set(prevMonthOrders.map((o: any) => o.customerId)).size;
  const prevMonthConvRate = prevMonthUsers.length > 0 ? (prevMonthUniqueBuyers / prevMonthUsers.length) * 100 : 0;

  let convDiffText = 'Sin datos previos';
  let convDiffColor = 'text-gray-500';
  if (prevMonthConvRate > 0) {
    const diff = thisMonthConvRate - prevMonthConvRate;
    convDiffText = `${diff >= 0 ? '↑' : '↓'} ${Math.abs(diff).toFixed(1)}% vs mes pasado`;
    convDiffColor = diff >= 0 ? 'text-green-600' : 'text-red-600';
  } else if (thisMonthConvRate > 0) {
    convDiffText = 'Nuevo este mes';
    convDiffColor = 'text-green-600';
  }

  // 8. Ticket Promedio (Gasto promedio por cada pedido)
  const averageTicket = orders.length > 0 ? (orders.reduce((sum: number, o: any) => sum + Number(o.total), 0) / orders.length) : 0;

  const thisMonthAvgTicket = thisMonthOrders.length > 0
    ? (thisMonthOrders.reduce((sum: number, o: any) => sum + Number(o.total), 0) / thisMonthOrders.length)
    : 0;

  const prevMonthAvgTicket = prevMonthOrders.length > 0
    ? (prevMonthOrders.reduce((sum: number, o: any) => sum + Number(o.total), 0) / prevMonthOrders.length)
    : 0;

  let ticketDiffText = 'Sin datos previos';
  let ticketDiffColor = 'text-gray-500';
  if (prevMonthAvgTicket > 0) {
    const diff = ((thisMonthAvgTicket - prevMonthAvgTicket) / prevMonthAvgTicket) * 100;
    ticketDiffText = `${diff >= 0 ? '↑' : '↓'} ${Math.abs(Math.round(diff))}% vs mes pasado`;
    ticketDiffColor = diff >= 0 ? 'text-green-600' : 'text-red-600';
  } else if (thisMonthAvgTicket > 0) {
    ticketDiffText = 'Nuevo este mes';
    ticketDiffColor = 'text-green-600';
  }

  // 9. Preferencias de Clientes (Colores, Tallas, Categorías)
  const colorCounts: Record<string, number> = {};
  const sizeCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};

  orders.forEach((o: any) => {
    o.items?.forEach((item: any) => {
      if (item.color) {
        const colorName = item.color.trim();
        colorCounts[colorName] = (colorCounts[colorName] || 0) + item.quantity;
      }
      if (item.size) {
        const sizeName = item.size.trim().toUpperCase();
        sizeCounts[sizeName] = (sizeCounts[sizeName] || 0) + item.quantity;
      }
      const catName = item.product?.category?.name || 'Prendas';
      categoryCounts[catName] = (categoryCounts[catName] || 0) + item.quantity;
    });
  });

  const topColors = Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  const topSizes = Object.entries(sizeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  // 10. Cálculos de entrega y distribución de pedidos (Kpis solicitados)
  const pendingOrdersCount = orders.filter((o: any) => o.status === 'PENDING').length;
  const processingOrdersCount = orders.filter((o: any) => o.status === 'PROCESSING' || o.status === 'CONFIRMED').length;
  const shippedOrdersCount = orders.filter((o: any) => o.status === 'SHIPPED').length;
  const deliveredOrdersCount = orders.filter((o: any) => o.status === 'DELIVERED').length;
  const cancelledOrdersCount = orders.filter((o: any) => o.status === 'CANCELLED' || o.status === 'REFUNDED' || o.status === 'RETURNED').length;

  const totalStatusCount = orders.length || 1;

  const pendingPercent = Math.round((pendingOrdersCount / totalStatusCount) * 100);
  const processingPercent = Math.round((processingOrdersCount / totalStatusCount) * 100);
  const shippedPercent = Math.round((shippedOrdersCount / totalStatusCount) * 100);
  const deliveredPercent = Math.round((deliveredOrdersCount / totalStatusCount) * 100);
  const cancelledPercent = Math.round((cancelledOrdersCount / totalStatusCount) * 100);

  // 11. Actividad Reciente
  interface ActivityEvent {
    id: string;
    title: string;
    description: string;
    createdAt: Date;
    icon: string;
    iconBg: string;
  }

  const events: ActivityEvent[] = [];

  users.slice(0, 5).forEach((u: any) => {
    events.push({
      id: `u-${u.id}`,
      title: `Nuevo Cliente: ${u.firstName} ${u.lastName || ''}`,
      description: `Registro completado • Hace ${Math.max(1, Math.round((Date.now() - new Date(u.createdAt).getTime()) / 60000))} min`,
      createdAt: new Date(u.createdAt),
      icon: '👤',
      iconBg: 'bg-gray-100 text-gray-700',
    });
  });

  orders.slice(0, 5).forEach((o: any) => {
    events.push({
      id: `o-${o.id}`,
      title: `Nuevo Pedido: ${o.orderNumber}`,
      description: `Cliente: ${o.customer?.firstName || 'Invitado'} • Total: S/ ${Number(o.total).toFixed(2)}`,
      createdAt: new Date(o.createdAt),
      icon: '📦',
      iconBg: 'bg-[#F4EEFF] text-[#9370DB]',
    });

    if (o.paymentStatus === 'COMPLETED') {
      events.push({
        id: `p-${o.id}`,
        title: `Pago Confirmado: S/ ${Number(o.total).toFixed(2)}`,
        description: `Pedido ${o.orderNumber} verificado exitosamente`,
        createdAt: new Date(o.updatedAt || o.createdAt),
        icon: '💰',
        iconBg: 'bg-[#FBEFEF] text-[#C15170]',
      });
    }
  });

  const recentActivity = events
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  const getRelativeTimeText = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="animate-enter space-y-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Visión General</h1>
          <p className="text-gray-600 font-medium text-sm">Bienvenido de nuevo al panel central de control de PHALAY.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all border border-gray-200 hover:border-gray-300 hover:shadow-sm">
            Exportar
          </button>
          <Link href="/productos/nuevo" className="bg-gradient-to-r from-[#8B5A5A] to-[#A87474] hover:from-[#9B6A6A] hover:to-[#B88484] text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]">
            <span>+</span> Nuevo Producto
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {/* KPI 1: Clientes Registrados */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all hover:-translate-y-1 duration-200 cursor-pointer group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-sm font-bold text-gray-700 uppercase tracking-wider block">Clientes Registrados</span>
              <span className="text-[10px] text-gray-400 font-medium block">Total de cuentas en la tienda</span>
            </div>
            <span className="text-xl group-hover:scale-110 transition-transform">👥</span>
          </div>
          <p className="text-3xl font-black text-gray-900 mb-2">{totalUsers}</p>
          <p className={`text-xs font-bold ${userDiffColor} flex items-center gap-1`}>
            <span>{userDiffText}</span>
          </p>
        </div>

        {/* KPI 2: Clientes Compradores */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all hover:-translate-y-1 duration-200 cursor-pointer group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-sm font-bold text-gray-700 uppercase tracking-wider block">Clientes con Compra</span>
              <span className="text-[10px] text-gray-400 font-medium block">Cuentas que compraron al menos una vez</span>
            </div>
            <span className="text-xl group-hover:scale-110 transition-transform">🛍️</span>
          </div>
          <p className="text-3xl font-black text-gray-900 mb-2">{uniqueBuyers} <span className="text-base text-gray-500 font-medium">de {totalUsers}</span></p>
          <p className="text-xs font-bold text-gray-500">— {buyerRatioPercent}% ratio de conversión global</p>
        </div>

        {/* KPI 3: Pedidos Totales */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all hover:-translate-y-1 duration-200 cursor-pointer group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-sm font-bold text-gray-700 uppercase tracking-wider block">Pedidos Totales</span>
              <span className="text-[10px] text-gray-400 font-medium block">Ventas totales e intentos de compra</span>
            </div>
            <span className="text-xl group-hover:scale-110 transition-transform">📦</span>
          </div>
          <p className="text-3xl font-black text-gray-900 mb-2">{totalOrders}</p>
          <p className={`text-xs font-bold ${orderDiffColor} flex items-center gap-1`}>
            <span>{orderDiffText}</span>
          </p>
        </div>

        {/* KPI 4: Ingresos Confirmados */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all hover:-translate-y-1 duration-200 cursor-pointer group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-sm font-bold text-gray-700 uppercase tracking-wider block">Ingresos Recaudados</span>
              <span className="text-[10px] text-gray-400 font-medium block">Dinero verificado y aprobado</span>
            </div>
            <span className="text-xl group-hover:scale-110 transition-transform">💰</span>
          </div>
          <p className="text-3xl font-black text-gray-900 mb-2">{formatCurrency(totalRevenue)}</p>
          <p className={`text-xs font-bold ${revDiffColor} flex items-center gap-1`}>
            <span>{revDiffText}</span>
          </p>
        </div>
      </div>

      {/* Main Grid: Chart and Right Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Left Column: Interactive Revenue Chart & Business Preferences Analysis */}
        <div className="lg:col-span-2 space-y-6 w-full">
          {/* Interactive Chart Component */}
          <PlatformRevenueChart monthlyData={lastMonths} yearlyData={lastYears} />

          {/* Section: Análisis de Conversión y Ticket Promedio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between hover:shadow-md hover:border-gray-300 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#F5D9D9] text-[#8B5A5A] rounded-lg flex items-center justify-center text-xl">📈</div>
                <div>
                  <p className="text-sm font-black text-gray-900">Conversión de Registro a Compra</p>
                  <p className="text-[11px] text-gray-500 font-semibold">Tasa de conversión mensual de cuentas creadas</p>
                </div>
              </div>
              <div>
                <p className="text-3xl font-black text-gray-950">{conversionRate}%</p>
                <p className={`text-xs font-bold ${convDiffColor} mt-2 flex items-center gap-1`}>
                  <span>{convDiffText}</span>
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between hover:shadow-md hover:border-gray-300 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#F5D9D9] text-[#8B5A5A] rounded-lg flex items-center justify-center text-xl">🛍️</div>
                <div>
                  <p className="text-sm font-black text-gray-900">Ticket Promedio por Pedido</p>
                  <p className="text-[11px] text-gray-500 font-semibold">Monto promedio gastado por cada compra</p>
                </div>
              </div>
              <div>
                <p className="text-3xl font-black text-gray-950">S/ {averageTicket.toFixed(2)}</p>
                <p className={`text-xs font-bold ${ticketDiffColor} mt-2 flex items-center gap-1`}>
                  <span>{ticketDiffText}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Section: Análisis de Preferencias de Compra (Colores, Tallas, Colecciones) */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Preferencias de Clientes y Tendencias</h2>
            <p className="text-xs text-gray-400 mb-6 font-medium">Conoce los productos, tallas y colores preferidos para orientar tu inventario y promociones.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Top Colores */}
              <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-4 flex items-center gap-1.5">
                  🎨 Colores Preferidos
                </h3>
                {topColors.length === 0 ? (
                  <p className="text-xs font-semibold text-gray-400 py-4 text-center">Sin datos de colores aún</p>
                ) : (
                  <div className="space-y-3">
                    {topColors.map((color, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-800 capitalize">{color.name}</span>
                        <span className="bg-white px-2 py-0.5 rounded border border-gray-200 text-[10px] font-black text-gray-500">
                          {color.count} {color.count === 1 ? 'prenda' : 'prendas'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Tallas */}
              <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-4 flex items-center gap-1.5">
                  📏 Tallas Más Vendidas
                </h3>
                {topSizes.length === 0 ? (
                  <p className="text-xs font-semibold text-gray-400 py-4 text-center">Sin datos de tallas aún</p>
                ) : (
                  <div className="space-y-3">
                    {topSizes.map((size, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-800">{size.name}</span>
                        <span className="bg-white px-2 py-0.5 rounded border border-gray-200 text-[10px] font-black text-gray-500">
                          {size.count} {size.count === 1 ? 'prenda' : 'prendas'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Categorías */}
              <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-4 flex items-center gap-1.5">
                  🏷️ Categorías / Colecciones
                </h3>
                {topCategories.length === 0 ? (
                  <p className="text-xs font-semibold text-gray-400 py-4 text-center">Sin datos de categorías aún</p>
                ) : (
                  <div className="space-y-3">
                    {topCategories.map((cat, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-800 truncate max-w-[120px]">{cat.name}</span>
                        <span className="bg-white px-2 py-0.5 rounded border border-gray-200 text-[10px] font-black text-gray-500">
                          {cat.count} {cat.count === 1 ? 'unidad' : 'unidades'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Estado de Pedidos & Actividad Reciente */}
        <div className="space-y-6 w-full">
          {/* Donut Chart: Estado de Pedidos y Entregas */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Estado de Pedidos y Entregas</h2>
            
            {/* Donut Progress Ring */}
            <div className="flex items-center gap-6 mb-6">
              <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  {/* Background Circle */}
                  <circle
                    cx="56"
                    cy="56"
                    r="45"
                    className="stroke-gray-100"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  {/* Foreground Circle */}
                  <circle
                    cx="56"
                    cy="56"
                    r="45"
                    className="stroke-[#A87474]"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={282.7}
                    strokeDashoffset={282.7 - (282.7 * deliveredPercent) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-gray-900">{deliveredPercent}%</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Entregados</span>
                </div>
              </div>

              <div className="flex-1 space-y-1">
                <h3 className="text-sm font-bold text-gray-950">Progreso de Despachos</h3>
                <p className="text-xs text-gray-500 font-medium">
                  {deliveredOrdersCount} de {totalOrders} pedidos completados exitosamente.
                </p>
              </div>
            </div>

            {/* Detailed distribution list */}
            <div className="space-y-3.5">
              {/* Pendientes */}
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                  <span>Pendientes de Pago / Revisión</span>
                  <span>{pendingOrdersCount} ({pendingPercent})</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-yellow-500 h-full rounded-full transition-all duration-500" style={{ width: `${pendingPercent}%` }}></div>
                </div>
              </div>

              {/* Procesando */}
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                  <span>En Preparación / Confirmados</span>
                  <span>{processingOrdersCount} ({processingPercent})</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${processingPercent}%` }}></div>
                </div>
              </div>

              {/* Enviados */}
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                  <span>Enviados con Agencia</span>
                  <span>{shippedOrdersCount} ({shippedPercent})</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${shippedPercent}%` }}></div>
                </div>
              </div>

              {/* Cancelados */}
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                  <span>Cancelados / Reembolsados</span>
                  <span>{cancelledOrdersCount} ({cancelledPercent})</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full rounded-full transition-all duration-500" style={{ width: `${cancelledPercent}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Actividad Reciente */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex justify-between items-center">
              Actividad Reciente 
              <button className="text-gray-400 hover:text-gray-600 text-xl">⋯</button>
            </h2>

            <div className="space-y-6">
              {recentActivity.length === 0 ? (
                <p className="text-xs font-semibold text-gray-400 text-center py-12">No hay actividad reciente.</p>
              ) : (
                recentActivity.map((evt) => (
                  <div key={evt.id} className="flex gap-4">
                    <div className={`w-10 h-10 rounded-full ${evt.iconBg} flex items-center justify-center shrink-0 font-bold text-lg`}>
                      {evt.icon}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{evt.title}</p>
                      <p className="text-xs text-gray-500">{evt.description} • {getRelativeTimeText(evt.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Link href="/orders" className="block text-center w-full mt-8 py-3 text-sm font-bold text-[#8B5A5A] hover:bg-[#FBEFEF] rounded-xl transition-colors">
              Ver todos los pedidos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
