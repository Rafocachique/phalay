'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createBrowserClient } from '@supabase/ssr';
import { User, Lock, Mail, Save, RefreshCw } from 'lucide-react';

export default function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          setEmail(session.user.email || '');
          
          // Obtener los datos reales de nuestra base de datos donde sí está el nombre
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          
          if (res.ok) {
            const dbUser = await res.json();
            setFirstName(dbUser.firstName || '');
            setLastName(dbUser.lastName || '');
          } else {
            // Fallback a metadata si falla
            setFirstName(session.user.user_metadata?.firstName || '');
            setLastName(session.user.user_metadata?.lastName || '');
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password) {
      if (password !== confirmPassword) {
        toast.error('Las contraseñas no coinciden');
        return;
      }
      if (password.length < 8) {
        toast.error('La contraseña debe tener al menos 8 caracteres para ser segura.');
        return;
      }
      // Validar seguridad de contraseña
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      
      if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
        toast.error('La contraseña debe incluir mayúsculas, minúsculas y números.');
        return;
      }
    }

    setSaving(true);
    try {
      const updateData: any = {
        data: { firstName, lastName }
      };

      if (email) updateData.email = email;
      if (password) updateData.password = password;

      const { error } = await supabase.auth.updateUser(updateData);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Perfil actualizado correctamente');
        if (password || email) {
          toast.info('Se ha actualizado tu correo/contraseña. Podrías necesitar iniciar sesión de nuevo o confirmar tu correo.', { duration: 5000 });
        }
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="animate-spin text-[#8B5A5A]" size={32} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-enter">
      <div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <User className="text-[#8B5A5A]" size={36} />
          Ajustes de Perfil
        </h1>
        <p className="text-gray-500 mt-2 font-medium">
          Actualiza tu información personal, correo electrónico y contraseña.
        </p>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Datos Personales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Nombre</label>
                <input 
                  type="text" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 transition-colors" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Apellido</label>
                <input 
                  type="text" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 transition-colors" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <Mail size={18} className="text-gray-400" /> Correo Electrónico
            </h3>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Email de Acceso</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 transition-colors" 
              />
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <Lock size={18} className="text-gray-400" /> Cambiar Contraseña
            </h3>
            <p className="text-xs text-gray-500 mb-2">Deja estos campos en blanco si no deseas cambiar tu contraseña actual.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Nueva Contraseña</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 transition-colors" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Confirmar Contraseña</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu nueva contraseña"
                  className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 transition-colors" 
                />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit"
              disabled={saving}
              className="w-full md:w-auto bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white px-8 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-70"
            >
              {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
