'use client';

import { useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  name: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  disabled?: boolean;
}

export default function PasswordInput({ name, placeholder, required, minLength, disabled }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // React no vuelve a aplicar el atributo `type` de un <input> en updates
  // posteriores al montaje (sólo lo fija una vez, al crear el nodo). Por eso
  // togglear el type vía prop declarativo no hace nada visualmente — hay que
  // mutarlo directo en el DOM.
  function toggle() {
    setVisible((prev) => {
      const next = !prev;
      if (inputRef.current) {
        inputRef.current.type = next ? 'text' : 'password';
      }
      return next;
    });
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="password"
        name={name}
        required={required}
        minLength={minLength}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full bg-[#F8F8F8] border border-transparent rounded-xl pl-4 pr-11 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      />
      <button
        type="button"
        onClick={toggle}
        tabIndex={-1}
        disabled={disabled}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 disabled:opacity-50"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
