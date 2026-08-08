'use client';
import { useState, useEffect } from 'react';
import { Truck, Plus, Building, Edit2, Trash2, CheckCircle2, MapPin, User, Package } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { getDestinations, getShippingRequests, saveDestination, deleteDestination, resolveShippingRequest, resolveRequestWithNewDestination, getAgencies, createAgency, updateAgency, deleteAgency } from '@/app/actions/shipping';

const EMPTY_FORM = {
  type: 'LIMA_METROPOLITANA',
  department: '',
  province: '',
  district: '',
  agencyId: '',
  agencyAddress: '',
  price: 0,
  estimatedDays: '',
  isActive: true,
};

export default function EnviosPage() {
  const [destinations, setDestinations] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'destinations' | 'requests' | 'agencies'>('destinations');

  // Alta rápida de agencias desde su propia sección
  const [newAgency, setNewAgency] = useState({ name: '', trackingUrl: '', contactPhone: '' });

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  // Si el modal se abrió desde una solicitud pendiente, guardamos su id para
  // crear el destino y resolverla en una sola operación.
  const [resolvingRequest, setResolvingRequest] = useState<any | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dest, reqs, ags] = await Promise.all([
        getDestinations(),
        getShippingRequests(),
        getAgencies(),
      ]);
      setDestinations(dest);
      setRequests(reqs);
      setAgencies(ags);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (dest?: any) => {
    setResolvingRequest(null);
    if (dest) {
      setEditingId(dest.id);
      setFormData({
        type: dest.type,
        department: dest.department || '',
        province: dest.province || '',
        district: dest.district || '',
        agencyId: dest.agencyId || '',
        agencyAddress: dest.agencyAddress || '',
        price: dest.price,
        estimatedDays: dest.estimatedDays || '',
        isActive: dest.isActive,
      });
    } else {
      setEditingId(null);
      setFormData({ ...EMPTY_FORM });
    }
    setIsModalOpen(true);
  };

  /**
   * Abre el mismo modal pero partiendo de una solicitud pendiente: se prellena
   * con lo que pidió la clienta para que sólo falte el precio.
   */
  const handleConfigureFromRequest = (request: any) => {
    const requested = (request.requestedName || '').trim();
    const isLima = /lima/i.test(requested) || request.type === 'LIMA_METROPOLITANA';

    setEditingId(null);
    setResolvingRequest(request);
    setFormData({
      ...EMPTY_FORM,
      type: isLima ? 'LIMA_METROPOLITANA' : 'PROVINCIA',
      district: isLima ? requested : '',
      department: isLima ? '' : requested,
      province: isLima ? '' : requested,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.price || Number(formData.price) <= 0) {
      toast.error('Indica el precio del envío para este destino.');
      return;
    }
    if (formData.type === 'PROVINCIA' && !formData.agencyId) {
      toast.error('Selecciona la agencia de transporte.');
      return;
    }

    // Si venimos de una solicitud, se crea el destino y se resuelve a la vez:
    // el pedido pendiente recibe su costo de envío y deja de estar "por cotizar".
    if (resolvingRequest) {
      const result = await resolveRequestWithNewDestination(resolvingRequest.id, formData);
      if ('error' in result) {
        toast.error(result.error || 'No se pudo configurar el destino');
        return;
      }
      toast.success('Destino configurado. El pedido ya tiene su costo de envío.');
      setIsModalOpen(false);
      setResolvingRequest(null);
      setActiveTab('destinations');
      fetchData();
      return;
    }

    const result = await saveDestination(editingId, formData);
    if ('error' in result) {
      toast.error(result.error || 'Ocurrió un error al guardar');
      return;
    }
    toast.success(editingId ? 'Destino actualizado' : 'Destino creado');
    setIsModalOpen(false);
    fetchData();
  };

  // ── Agencias ──

  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgency.name.trim()) {
      toast.error('Escribe el nombre de la agencia.');
      return;
    }
    const result = await createAgency(newAgency);
    if ('error' in result) {
      toast.error(result.error || 'No se pudo crear la agencia');
      return;
    }
    toast.success('Agencia registrada');
    setNewAgency({ name: '', trackingUrl: '', contactPhone: '' });
    fetchData();
  };

  const handleToggleAgency = async (agency: any) => {
    const result = await updateAgency(agency.id, { isActive: !agency.isActive });
    if ('error' in result) {
      toast.error(result.error || 'No se pudo actualizar');
      return;
    }
    toast.success(agency.isActive ? 'Agencia desactivada' : 'Agencia activada');
    fetchData();
  };

  const handleRenameAgency = async (agency: any) => {
    const name = prompt('Nuevo nombre de la agencia:', agency.name);
    if (!name || name.trim() === agency.name) return;
    const result = await updateAgency(agency.id, { name: name.trim() });
    if ('error' in result) {
      toast.error(result.error || 'No se pudo renombrar');
      return;
    }
    toast.success('Agencia actualizada en todos sus destinos');
    fetchData();
  };

  const handleDeleteAgency = async (agency: any) => {
    if (!confirm(`¿Eliminar la agencia "${agency.name}"?`)) return;
    const result = await deleteAgency(agency.id);
    if ('error' in result) {
      toast.error(result.error || 'No se pudo eliminar');
      return;
    }
    toast.success('Agencia eliminada');
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este destino?')) return;
    const result = await deleteDestination(id);
    if ('error' in result) {
      toast.error(result.error || 'Error al eliminar');
      return;
    }
    toast.success('Destino eliminado');
    fetchData();
  };

  const handleResolveRequest = async (id: string, destinationId?: string) => {
    const result = await resolveShippingRequest(id, destinationId);
    if ('error' in result) {
      toast.error(result.error || 'Error al resolver la solicitud');
      return;
    }
    toast.success('Solicitud marcada como resuelta');
    fetchData();
  };

  return (
    <>
      <div className="animate-enter space-y-6">
        <Toaster position="top-right" richColors />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Truck className="text-[#8B5A5A]" /> Envíos y Destinos
          </h1>
          <p className="text-gray-500 font-medium text-sm mt-1">Gestiona los distritos de Lima y agencias de provincia</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-gradient-to-r from-[#8B5A5A] to-[#A87474] text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <Plus size={18} /> Nuevo Destino
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('destinations')}
          className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'destinations' ? 'border-[#8B5A5A] text-[#8B5A5A]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          Destinos Configurados ({destinations.length})
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'requests' ? 'border-[#8B5A5A] text-[#8B5A5A]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          Solicitudes Pendientes ({requests.filter(r => r.status === 'PENDING').length})
        </button>
        <button
          onClick={() => setActiveTab('agencies')}
          className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'agencies' ? 'border-[#8B5A5A] text-[#8B5A5A]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          Agencias ({agencies.length})
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400 font-medium">Cargando datos...</div>
      ) : activeTab === 'agencies' ? (
        <div className="space-y-6">
          {/* Alta de agencia */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Registrar agencia de transporte</h2>
            <p className="text-sm text-gray-500 mb-5">
              Estas agencias son las únicas que se podrán elegir al configurar un destino de provincia,
              para que el nombre quede siempre escrito igual.
            </p>
            <form onSubmit={handleCreateAgency} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nombre *</label>
                <input
                  type="text"
                  value={newAgency.name}
                  onChange={e => setNewAgency({ ...newAgency, name: e.target.value })}
                  placeholder="Ej. Shalom"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8B5A5A]/20 focus:border-[#8B5A5A] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Teléfono</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={9}
                  value={newAgency.contactPhone}
                  onChange={e => setNewAgency({ ...newAgency, contactPhone: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                  placeholder="999888777"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8B5A5A]/20 focus:border-[#8B5A5A] outline-none"
                />
              </div>
              <button
                type="submit"
                className="bg-[#8B5A5A] hover:bg-[#7A4A4A] text-white px-5 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Agregar
              </button>
            </form>
          </div>

          {/* Listado */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                  <th className="p-4 font-bold">Agencia</th>
                  <th className="p-4 font-bold">Teléfono</th>
                  <th className="p-4 font-bold">Destinos que la usan</th>
                  <th className="p-4 font-bold">Estado</th>
                  <th className="p-4 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {agencies.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-400">Aún no hay agencias registradas.</td></tr>
                )}
                {agencies.map(agency => (
                  <tr key={agency.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-gray-900 flex items-center gap-2">
                        <Building size={15} className="text-[#8B5A5A]" /> {agency.name}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{agency.contactPhone || '-'}</td>
                    <td className="p-4 text-sm text-gray-600">{agency._count?.destinations ?? 0}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${agency.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {agency.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button onClick={() => handleRenameAgency(agency)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Renombrar">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleToggleAgency(agency)} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                        {agency.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                      <button onClick={() => handleDeleteAgency(agency)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'destinations' ? (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Lima Metropolitana</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-bold">Distrito</th>
                <th className="p-4 font-bold">Precio (S/)</th>
                <th className="p-4 font-bold">Tiempo Est.</th>
                <th className="p-4 font-bold">Estado</th>
                <th className="p-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {destinations.filter(d => d.type === 'LIMA_METROPOLITANA').length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No hay destinos configurados en Lima.</td></tr>
              )}
              {destinations.filter(d => d.type === 'LIMA_METROPOLITANA').map(dest => (
                <tr key={dest.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{dest.district}</div>
                  </td>
                  <td className="p-4 font-bold text-[#8B5A5A]">S/ {Number(dest.price).toFixed(2)}</td>
                  <td className="p-4 text-sm text-gray-600">{dest.estimatedDays || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${dest.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {dest.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-4 flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(dest)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(dest.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Envíos a Provincia</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-bold">Departamento / Provincia</th>
                <th className="p-4 font-bold">Agencia</th>
                <th className="p-4 font-bold">Precio (S/)</th>
                <th className="p-4 font-bold">Tiempo Est.</th>
                <th className="p-4 font-bold">Estado</th>
                <th className="p-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {destinations.filter(d => d.type === 'PROVINCIA').length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">No hay destinos configurados en Provincia.</td></tr>
              )}
              {destinations.filter(d => d.type === 'PROVINCIA').map(dest => (
                <tr key={dest.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{dest.department}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{dest.province}</div>
                  </td>
                  <td className="p-4">
                    <span className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 mb-1">
                      <Building size={12}/> {dest.agencyName}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-[#8B5A5A]">S/ {Number(dest.price).toFixed(2)}</td>
                  <td className="p-4 text-sm text-gray-600">{dest.estimatedDays || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${dest.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {dest.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-4 flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(dest)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(dest.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        <div className="space-y-4">
          {requests.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">No hay solicitudes de destinos pendientes.</div>
          )}
          {requests.map(req => (
            <div key={req.id} className={`bg-white rounded-xl border overflow-hidden ${req.status === 'PENDING' ? 'border-orange-200 shadow-sm' : 'border-gray-200 opacity-70'}`}>
              <div className="p-5 flex flex-col lg:flex-row justify-between gap-5">
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${req.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                        {req.status === 'PENDING' ? 'Falta precio' : 'Resuelto'}
                      </span>
                      <span className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleString()}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <MapPin size={18} className="text-[#8B5A5A]" />
                      Destino solicitado: "{req.requestedName}"
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Dirección exacta a la que hay que llegar */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                        <MapPin size={12} /> Dirección de entrega
                      </p>
                      {req.order?.address ? (
                        <>
                          <p className="text-sm text-gray-800 font-medium">{req.order.address.street}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {req.order.address.city}
                            {req.order.address.state && req.order.address.state !== req.order.address.city
                              ? ` · ${req.order.address.state}`
                              : ''}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400">Sin dirección registrada</p>
                      )}
                    </div>

                    {/* Con quién coordinar */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                        <User size={12} /> Cliente
                      </p>
                      <p className="text-sm text-gray-800 font-medium">
                        {req.customer?.firstName} {req.customer?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{req.customer?.email}</p>
                      {req.customer?.phone && (
                        <p className="text-xs text-gray-500">Cel: {req.customer.phone}</p>
                      )}
                      {req.customer?.dni && (
                        <p className="text-xs text-gray-500">DNI: {req.customer.dni}</p>
                      )}
                    </div>
                  </div>

                  {/* Pedido en espera del costo de envío */}
                  {req.order && (
                    <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-4">
                      <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 mb-2 flex items-center gap-1.5">
                        <Package size={12} /> Pedido en espera
                      </p>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                        <span className="font-mono font-bold text-[#8B5A5A]">{req.order.orderNumber}</span>
                        <span className="text-gray-600">
                          Productos: <strong>S/ {Number(req.order.subtotal).toFixed(2)}</strong>
                        </span>
                        <span className="text-gray-600">
                          Envío: <strong className={Number(req.order.shippingCost) === 0 ? 'text-orange-600' : 'text-gray-800'}>
                            {Number(req.order.shippingCost) === 0 ? 'Por cotizar' : `S/ ${Number(req.order.shippingCost).toFixed(2)}`}
                          </strong>
                        </span>
                        <span className="text-gray-900 font-bold">
                          Total: S/ {Number(req.order.total).toFixed(2)}
                        </span>
                      </div>
                      {req.order.items?.length > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          {req.order.items.map((i: any) => `${i.productName} x${i.quantity}`).join(' · ')}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {req.status === 'PENDING' && (
                  <div className="flex lg:flex-col gap-2 lg:w-56 flex-shrink-0">
                    <button
                      onClick={() => handleConfigureFromRequest(req)}
                      className="flex-1 bg-[#8B5A5A] hover:bg-[#7A4A4A] text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <Plus size={16} /> Configurar precio
                    </button>
                    <button
                      onClick={() => handleResolveRequest(req.id)}
                      className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 px-4 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                      title="Descartar sin crear el destino (por ejemplo, si no hay cobertura)"
                    >
                      <CheckCircle2 size={16} /> Descartar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Modal CRUD Destinos */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-enter">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-black text-lg text-gray-900">
                {resolvingRequest ? 'Configurar destino solicitado' : editingId ? 'Editar Destino' : 'Nuevo Destino'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); setResolvingRequest(null); }} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">

              {resolvingRequest && (
                <div className="bg-[#FBEFEF] border border-[#8B5A5A]/20 rounded-xl p-4 text-sm">
                  <p className="font-bold text-[#8B5A5A] mb-1">
                    Solicitado por la clienta: "{resolvingRequest.requestedName}"
                  </p>
                  <p className="text-xs text-gray-600">
                    Al guardar, este destino quedará disponible en el checkout y el pedido
                    {resolvingRequest.order ? ` ${resolvingRequest.order.orderNumber}` : ''} recibirá su costo de envío.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tipo de Envio</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'LIMA_METROPOLITANA'})}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                      formData.type === 'LIMA_METROPOLITANA' ? 'border-[#8B5A5A] bg-[#8B5A5A]/5 text-[#8B5A5A]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Lima Metropolitana
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'PROVINCIA'})}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                      formData.type === 'PROVINCIA' ? 'border-[#8B5A5A] bg-[#8B5A5A]/5 text-[#8B5A5A]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Envío a Provincia
                  </button>
                </div>
              </div>

              {formData.type === 'LIMA_METROPOLITANA' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Distrito</label>
                  <input 
                    type="text" 
                    value={formData.district} 
                    onChange={e => setFormData({...formData, district: e.target.value})}
                    placeholder="Ej. Miraflores, San Isidro..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#8B5A5A]/20 focus:border-[#8B5A5A] outline-none"
                    required
                  />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Departamento</label>
                      <input 
                        type="text" 
                        value={formData.department} 
                        onChange={e => setFormData({...formData, department: e.target.value})}
                        placeholder="Ej. Arequipa"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8B5A5A]/20 focus:border-[#8B5A5A] outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Provincia</label>
                      <input 
                        type="text" 
                        value={formData.province} 
                        onChange={e => setFormData({...formData, province: e.target.value})}
                        placeholder="Ej. Arequipa"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8B5A5A]/20 focus:border-[#8B5A5A] outline-none"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Agencia</label>
                    {/* Sólo agencias del catálogo: evita nombres escritos a mano
                        con variantes ("shalon", "SHALOM", "shalom courier"). */}
                    <select
                      value={formData.agencyId}
                      onChange={e => setFormData({...formData, agencyId: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8B5A5A]/20 focus:border-[#8B5A5A] outline-none"
                      required
                    >
                      <option value="">Selecciona una agencia...</option>
                      {agencies.filter(a => a.isActive || a.id === formData.agencyId).map(a => (
                        <option key={a.id} value={a.id}>{a.name}{a.isActive ? '' : ' (inactiva)'}</option>
                      ))}
                    </select>
                    {agencies.length === 0 && (
                      <p className="text-[11px] text-orange-600 mt-1.5">
                        Aún no tienes agencias registradas. Créalas en la pestaña "Agencias".
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Dirección de Agencia (Opcional)</label>
                    <input 
                      type="text" 
                      value={formData.agencyAddress} 
                      onChange={e => setFormData({...formData, agencyAddress: e.target.value})}
                      placeholder="Ej. Av. Principal 123"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8B5A5A]/20 focus:border-[#8B5A5A] outline-none"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Precio del Envío (S/)</label>
                  <input 
                    type="number" 
                    step="0.10"
                    min="0.10"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#8B5A5A] focus:ring-2 focus:ring-[#8B5A5A]/20 focus:border-[#8B5A5A] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tiempo Est. (Opcional)</label>
                  <input 
                    type="text" 
                    value={formData.estimatedDays} 
                    onChange={e => setFormData({...formData, estimatedDays: e.target.value})}
                    placeholder="Ej. 1-2 días"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8B5A5A]/20 focus:border-[#8B5A5A] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  className="w-5 h-5 text-[#8B5A5A] rounded focus:ring-[#8B5A5A]"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-gray-700 cursor-pointer">Destino Activo (Visible en Checkout)</label>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-bold text-sm hover:bg-gray-50 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="bg-[#8B5A5A] hover:bg-[#7A4A4A] text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm">
                  Guardar Destino
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
