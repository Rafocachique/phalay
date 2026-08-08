'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Users, UserCheck, ToggleLeft, ToggleRight, 
  Trash2, Edit, Plus, Search, X, Check, Copy, AlertCircle 
} from 'lucide-react';
import { createUser, updateUser, deleteUser } from '../actions/users';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
}

interface UsersClientProps {
  initialUsers: User[];
}

export function UsersClient({ initialUsers }: UsersClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'CUSTOMER' as 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
  });

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTempPassword, setCreatedTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Filtering logic
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCopyPassword = () => {
    if (createdTempPassword) {
      navigator.clipboard.writeText(createdTempPassword);
      setCopied(true);
      toast.success('Contraseña copiada al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await createUser({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        status: formData.status as any,
      });

      if (res.success && res.data) {
        setUsers([res.data, ...users]);
        setCreatedTempPassword(res.tempPassword || null);
        toast.success('Usuario creado con éxito');
        // Reset only the fields, keep password visible in modal
      } else {
        toast.error(res.error || 'Error al crear el usuario');
      }
    } catch (err: any) {
      toast.error('Error de red al intentar crear el usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    try {
      const res = await updateUser(selectedUser.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        status: formData.status,
      });

      if (res.success && res.data) {
        setUsers(users.map(u => u.id === selectedUser.id ? res.data : u));
        toast.success('Usuario actualizado correctamente');
        setIsEditOpen(false);
        setSelectedUser(null);
      } else {
        toast.error(res.error || 'Error al actualizar el usuario');
      }
    } catch (err: any) {
      toast.error('Error de red al intentar actualizar el usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const res = await deleteUser(selectedUser.id);
      if (res.success) {
        setUsers(users.filter(u => u.id !== selectedUser.id));
        toast.success('Usuario eliminado permanentemente');
        setIsDeleteOpen(false);
        setSelectedUser(null);
      } else {
        toast.error(res.error || 'Error al eliminar el usuario');
      }
    } catch (err: any) {
      toast.error('Error de red al intentar eliminar el usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await updateUser(user.id, { status: newStatus as any });
      if (res.success && res.data) {
        setUsers(users.map(u => u.id === user.id ? res.data : u));
        toast.success(`Usuario ${newStatus === 'ACTIVE' ? 'Activado' : 'Desactivado'}`);
      } else {
        toast.error(res.error || 'Error al cambiar estado');
      }
    } catch (err) {
      toast.error('Error de conexión');
    }
  };

  const openCreateModal = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'CUSTOMER',
      status: 'ACTIVE',
    });
    setCreatedTempPassword(null);
    setIsCreateOpen(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status as any,
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-transparent';
      case 'ADMIN':
        return 'bg-[#FBEFEF] text-[#8B5A5A] border-[#8B5A5A]/10';
      case 'SELLER':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Users className="text-[#8B5A5A]" size={36} />
            Gestión de Usuarios y Roles
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            Administra los roles, accesos y estados de clientes, vendedores y administradores.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openCreateModal}
          className="w-full md:w-auto bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
        >
          <Plus size={20} />
          Nuevo Miembro de Equipo
        </motion.button>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por email, nombre o apellido..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F8F9FA] border border-gray-100 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-900 focus:border-[#8B5A5A] focus:bg-white outline-none transition-all shadow-inner"
          />
        </div>
        <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="flex-1 md:w-40 bg-white border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-700 focus:border-[#8B5A5A] outline-none cursor-pointer"
          >
            <option value="ALL">Todos los Roles</option>
            <option value="SUPER_ADMIN">Super Administrador</option>
            <option value="ADMIN">Administrador</option>
            <option value="CUSTOMER">Cliente</option>
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:w-40 bg-white border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-700 focus:border-[#8B5A5A] outline-none cursor-pointer"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
            <option value="SUSPENDED">Suspendidos</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FAF9F9] text-gray-500 font-bold uppercase text-[11px] tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-8 py-5">Nombre / Email</th>
                <th className="px-6 py-5">Rol</th>
                <th className="px-6 py-5">Fecha Registro</th>
                <th className="px-6 py-5">Estado</th>
                <th className="px-8 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-600">
              <AnimatePresence mode="popLayout">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-20 text-gray-400">
                      <Users className="mx-auto mb-4 opacity-30" size={48} />
                      <p className="font-serif text-lg text-gray-500">No se encontraron usuarios</p>
                      <p className="text-xs text-gray-400 mt-1">Prueba cambiando tus filtros de búsqueda.</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <motion.tr 
                      key={u.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-8 py-4.5">
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-[#8B5A5A] transition-colors">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getRoleBadge(u.role)}`}>
                          {u.role === 'SUPER_ADMIN' ? 'Super Administrador' : u.role === 'ADMIN' ? 'Administrador' : u.role === 'CUSTOMER' ? 'Cliente' : u.role === 'SELLER' ? 'Vendedor' : u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-gray-500 text-xs">
                        {new Date(u.createdAt).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            u.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' :
                            u.status === 'SUSPENDED' ? 'bg-red-500' : 'bg-gray-300'
                          }`}></span>
                          <span className="font-bold text-xs">
                            {u.status === 'ACTIVE' ? 'Activo' : 
                             u.status === 'SUSPENDED' ? 'Suspendido' : 'Inactivo'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-4.5 text-right space-x-2">
                        {/* Toggle Status Switch */}
                        <button 
                          onClick={() => toggleStatus(u)}
                          title={u.status === 'ACTIVE' ? 'Desactivar usuario' : 'Activar usuario'}
                          className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {u.status === 'ACTIVE' ? <ToggleRight size={20} className="text-[#8B5A5A]" /> : <ToggleLeft size={20} />}
                        </button>
                        
                        {/* Editar */}
                        <button 
                          onClick={() => openEditModal(u)}
                          className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
                          title="Editar rol y nombre"
                        >
                          <Edit size={18} />
                        </button>

                        {/* Eliminar */}
                        <button 
                          onClick={() => openDeleteModal(u)}
                          className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-600 transition-colors"
                          title="Eliminar usuario"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREAR USUARIO */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px]">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl p-8 max-w-md w-full relative"
            >
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="absolute right-6 top-6 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">Crear Miembro de Equipo</h3>
              <p className="text-gray-500 text-xs mb-6">Completa los campos para generar un nuevo perfil con acceso administrado.</p>

              {createdTempPassword ? (
                // Éxito con contraseña temporal
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center flex flex-col items-center">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                      <UserCheck size={24} />
                    </div>
                    <h4 className="font-bold text-green-900 mb-1">¡Usuario Creado Exitosamente!</h4>
                    <p className="text-xs text-green-700 leading-relaxed">
                      El perfil ha sido registrado en Supabase Auth y en la Base de Datos. Proporciona las credenciales a continuación:
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4.5 space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Correo de Acceso</p>
                      <p className="font-bold text-gray-800 text-sm mt-0.5">{formData.email}</p>
                    </div>
                    <div className="relative">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Contraseña Temporal</p>
                      <div className="flex justify-between items-center bg-white border border-gray-200 rounded-xl px-3 py-2 mt-1 shadow-sm">
                        <code className="text-sm font-bold font-mono text-[#8B5A5A]">{createdTempPassword}</code>
                        <button 
                          onClick={handleCopyPassword}
                          className="text-[#8B5A5A] hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
                          title="Copiar contraseña"
                        >
                          {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800 text-xs leading-relaxed">
                    <AlertCircle size={20} className="shrink-0" />
                    <p>
                      <strong>Importante:</strong> Asegúrate de copiar esta contraseña ahora. No se volverá a mostrar por razones de seguridad.
                    </p>
                  </div>

                  <button 
                    onClick={() => {
                      setCreatedTempPassword(null);
                      setIsCreateOpen(false);
                    }}
                    className="w-full bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white py-3.5 rounded-2xl font-bold transition-all"
                  >
                    Entendido
                  </button>
                </div>
              ) : (
                // Formulario estándar
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Nombre</label>
                      <input 
                        type="text" 
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#8B5A5A]"
                        placeholder="Ej. María"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Apellido</label>
                      <input 
                        type="text" 
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#8B5A5A]"
                        placeholder="Ej. Quispe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Correo Electrónico</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#8B5A5A]"
                      placeholder="nombre@ejemplo.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Rol de Acceso</label>
                      <select 
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white outline-none focus:border-[#8B5A5A]"
                      >
                        <option value="CUSTOMER">Cliente</option>
                        <option value="ADMIN">Administrador</option>
                        <option value="SUPER_ADMIN">Super Administrador</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Estado</label>
                      <select 
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white outline-none focus:border-[#8B5A5A]"
                      >
                        <option value="ACTIVE">Activo</option>
                        <option value="INACTIVE">Inactivo</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all mt-6"
                  >
                    {isSubmitting ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      'Crear Usuario'
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL EDITAR USUARIO */}
      <AnimatePresence>
        {isEditOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px]">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl p-8 max-w-md w-full relative"
            >
              <button 
                onClick={() => {
                  setIsEditOpen(false);
                  setSelectedUser(null);
                }}
                className="absolute right-6 top-6 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">Editar Usuario</h3>
              <p className="text-gray-500 text-xs mb-6">Actualiza los datos del usuario: <span className="font-bold">{selectedUser.email}</span></p>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Nombre</label>
                    <input 
                      type="text" 
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#8B5A5A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Apellido</label>
                    <input 
                      type="text" 
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#8B5A5A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Rol de Acceso</label>
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white outline-none focus:border-[#8B5A5A]"
                    >
                      <option value="CUSTOMER">Cliente</option>
                      <option value="ADMIN">Administrador</option>
                      <option value="SUPER_ADMIN">Super Administrador</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Estado</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white outline-none focus:border-[#8B5A5A]"
                    >
                      <option value="ACTIVE">Activo</option>
                      <option value="INACTIVE">Inactivo</option>
                      <option value="SUSPENDED">Suspendido</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all mt-6"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL ELIMINAR USUARIO */}
      <AnimatePresence>
        {isDeleteOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px]">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl p-8 max-w-sm w-full text-center flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
                <AlertCircle className="text-red-500" size={32} />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">¿Estás seguro?</h3>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                Estás a punto de eliminar la cuenta de <span className="font-bold text-gray-900">{selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})</span>. Esta acción revocará sus accesos y es irreversible.
              </p>

              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => {
                    setIsDeleteOpen(false);
                    setSelectedUser(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-5 py-3.5 text-sm font-bold text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeleteSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-5 py-3.5 text-sm font-bold text-white bg-red-600 rounded-2xl hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
