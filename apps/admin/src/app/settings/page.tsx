'use client';
import SettingsForm from './SettingsForm';

export default function SettingsPage() {
  return (
    <div className="animate-enter w-full space-y-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900">Mi Tienda</h1>
        <p className="text-sm text-gray-500 mt-2">Gestiona la información general, redes sociales, preguntas frecuentes y métodos de pago.</p>
      </div>

      <SettingsForm />

    </div>
  );
}
