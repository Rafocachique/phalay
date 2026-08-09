'use client';

import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { User, Lock, Mail, Save, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { updateOwnProfile } from '@/app/actions/profile';

function PasswordField({ name, placeholder }: { name: string; placeholder: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        name={name}
        placeholder={placeholder}
        autoComplete="new-password"
        className="w-full bg-[#F8F9FA] border border-transparent rounded-xl pl-4 pr-11 py-3 text-sm focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 transition-colors"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible(!visible)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

interface PerfilFormProps {
  initialFirstName: string;
  initialLastName: string;
  email: string;
  role: string;
}

export default function PerfilForm({ initialFirstName, initialLastName, email, role }: PerfilFormProps) {
  const [state, formAction, isPending] = useActionState(updateOwnProfile, null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.message);
  }, [state]);

  return (
    <div className="w-full space-y-8 animate-enter">
      <div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <User className="text-[#8B5A5A]" size={36} />
          Ajustes de Perfil
        </h1>
        <p className="text-gray-500 mt-2 font-medium">
          Actualiza tu nombre y tu contraseña de acceso al panel.
        </p>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm w-full">
        <form action={formAction} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Datos Personales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Nombre</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  defaultValue={initialFirstName}
                  className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Apellido</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  defaultValue={initialLastName}
                  className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <Mail size={18} className="text-gray-400" /> Cuenta
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-700">{email}</span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FBEFEF] text-[#8B5A5A]">
                {role === 'SUPER_ADMIN' ? 'Super Administrador' : 'Administrador'}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              El correo de acceso y el rol sólo puede cambiarlos un Super Administrador desde Usuarios.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <Lock size={18} className="text-gray-400" /> Cambiar Contraseña
            </h3>
            <p className="text-xs text-gray-500">
              Déjalos en blanco si no quieres cambiarla. Mínimo 8 caracteres, con mayúsculas, minúsculas y números.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Nueva Contraseña</label>
                <PasswordField name="password" placeholder="Mínimo 8 caracteres" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Confirmar Contraseña</label>
                <PasswordField name="confirmPassword" placeholder="Repite tu nueva contraseña" />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={isPending}
              className="w-full md:w-auto bg-[#8B5A5A] hover:bg-[#6A3F3F] text-white px-8 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-70"
            >
              {isPending ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
              {isPending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
