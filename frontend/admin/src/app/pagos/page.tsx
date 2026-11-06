'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CreditCard, Smartphone, Banknote, RefreshCw, AlertTriangle } from 'lucide-react';
import { getStoreSettings, updatePaymentSettings } from '@/app/actions/store';
import ImageUpload from '@/components/ImageUpload';

type PaymentSettings = {
  paymentCardEnabled: boolean;
  paymentYapeEnabled: boolean;
  paymentManualEnabled: boolean;
  yapeQrUrl: string;
  whatsappNumber: string;
  manualPaymentInfo: string;
};

type FieldErrors = Partial<Record<'yapeQrUrl' | 'whatsappNumber' | 'methods', string>>;

const METHODS = [
  {
    key: 'paymentCardEnabled' as const,
    title: 'Tarjeta de crédito o débito',
    description: 'Tu clienta paga con su tarjeta y el cobro entra al instante.',
    icon: CreditCard,
  },
  {
    key: 'paymentYapeEnabled' as const,
    title: 'Yape automático',
    description: 'Tu clienta paga con Yape y el cobro se confirma solo. Compras desde S/ 6.00.',
    icon: Smartphone,
  },
  {
    key: 'paymentManualEnabled' as const,
    title: 'Yape con QR',
    description: 'Tu clienta escanea tu QR, paga y te manda la captura por WhatsApp. Tú revisas y apruebas.',
    icon: Banknote,
  },
];

export default function PagosPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [settings, setSettings] = useState<PaymentSettings>({
    paymentCardEnabled: true,
    paymentYapeEnabled: true,
    paymentManualEnabled: false,
    yapeQrUrl: '',
    whatsappNumber: '',
    manualPaymentInfo: '',
  });

  useEffect(() => {
    getStoreSettings()
      .then(data => {
        if (data) {
          setSettings({
            paymentCardEnabled: data.paymentCardEnabled ?? true,
            paymentYapeEnabled: data.paymentYapeEnabled ?? true,
            paymentManualEnabled: data.paymentManualEnabled ?? false,
            yapeQrUrl: data.yapeQrUrl || '',
            whatsappNumber: data.whatsappNumber || '',
            manualPaymentInfo: data.manualPaymentInfo || '',
          });
        }
      })
      .catch(() => toast.error('Error al cargar la configuración de pagos'))
      .finally(() => setLoading(false));
  }, []);

  const noneEnabled =
    !settings.paymentCardEnabled && !settings.paymentYapeEnabled && !settings.paymentManualEnabled;

  /** Valida y devuelve los errores por campo, para señalarlos donde están. */
  const validate = (): FieldErrors => {
    const next: FieldErrors = {};

    if (noneEnabled) {
      next.methods = 'Deja al menos una forma de pago activa o nadie podrá comprar.';
    }

    if (settings.paymentManualEnabled) {
      if (!settings.yapeQrUrl) {
        next.yapeQrUrl = 'Sube la foto de tu QR: es con lo que tu clienta te paga.';
      }
      if (!settings.whatsappNumber) {
        next.whatsappNumber = 'Necesitamos tu WhatsApp para que te envíen la captura del pago.';
      } else if (!/^\d{9}$/.test(settings.whatsappNumber)) {
        next.whatsappNumber = 'El número debe tener 9 dígitos.';
      }
    }

    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // El detalle va junto a cada campo; el aviso general sólo orienta.
      toast.error('Revisa los campos marcados en rojo.');
      return;
    }

    setSaving(true);
    const result = await updatePaymentSettings(settings);
    if ('success' in result && result.success) {
      toast.success('Configuración de pagos guardada');
    } else {
      toast.error('error' in result ? result.error : 'Error al guardar');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="animate-spin text-[#8B5A5A]" size={32} />
      </div>
    );
  }

  return (
    <div className="animate-enter w-full space-y-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900">Configuración de Pagos</h1>
        <p className="text-sm text-gray-500 mt-2">
          Elige cómo pueden pagarte tus clientas.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Formas de pago</h2>

          <div className="space-y-4">
            {METHODS.map(({ key, title, description, icon: Icon }) => (
              <label
                key={key}
                className={`flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${
                  settings[key] ? 'border-[#8B5A5A] bg-[#FBEFEF]/40' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={e => setSettings({ ...settings, [key]: e.target.checked })}
                  className="mt-1 w-5 h-5 accent-[#8B5A5A] rounded"
                />
                <span
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    settings[key] ? 'bg-[#8B5A5A] text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Icon size={20} />
                </span>
                <span className="flex-1">
                  <span className="block font-bold text-gray-900">{title}</span>
                  <span className="block text-sm text-gray-500 mt-0.5">{description}</span>
                </span>
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    settings[key] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {settings[key] ? 'Activo' : 'Oculto'}
                </span>
              </label>
            ))}
          </div>

          {errors.methods && (
            <div className="mt-5 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl font-medium">
              <AlertTriangle size={16} />
              {errors.methods}
            </div>
          )}
        </div>

        {settings.paymentManualEnabled && (
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Tu Yape</h2>
            <p className="text-sm text-gray-500 mb-6">
              Esto es lo que verá tu clienta para pagarte y enviarte su captura.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Tu WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={9}
                    value={settings.whatsappNumber}
                    onChange={e => {
                      setSettings({ ...settings, whatsappNumber: e.target.value.replace(/\D/g, '').slice(0, 9) });
                      if (errors.whatsappNumber) setErrors({ ...errors, whatsappNumber: undefined });
                    }}
                    placeholder="999888777"
                    className={`w-full rounded-xl px-4 py-3.5 outline-none text-gray-900 font-medium transition-colors ${
                      errors.whatsappNumber
                        ? 'bg-red-50 border-2 border-red-400 focus:border-red-500'
                        : 'bg-[#F8F9FA] border border-transparent focus:bg-white focus:border-[#8B5A5A]'
                    }`}
                  />
                  {errors.whatsappNumber ? (
                    <p className="text-[12px] text-red-600 font-medium mt-1.5 flex items-center gap-1">
                      <AlertTriangle size={12} /> {errors.whatsappNumber}
                    </p>
                  ) : (
                    <p className="text-[11px] text-gray-500 mt-1.5">
                      Aquí te llegarán las capturas de pago. 9 dígitos, sin +51.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Mensaje para tu clienta (opcional)</label>
                  <textarea
                    value={settings.manualPaymentInfo}
                    onChange={e => setSettings({ ...settings, manualPaymentInfo: e.target.value })}
                    rows={3}
                    placeholder="Ej. Yapea a nombre de PHALAY y mándame la captura para confirmar tu pedido."
                    className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 resize-none"
                  />
                </div>
              </div>

              <div>
                {/* Carga real de la imagen: antes sólo se podía pegar una URL,
                    por eso no había forma de subir el QR desde el celular. */}
                <div className={errors.yapeQrUrl ? 'ring-2 ring-red-400 rounded-xl p-3 bg-red-50/40' : ''}>
                  <ImageUpload
                    name="yapeQrUrl"
                    label="Foto de tu código QR *"
                    currentUrl={settings.yapeQrUrl}
                    onUrlChange={(url) => {
                      setSettings(s => ({ ...s, yapeQrUrl: url }));
                      if (errors.yapeQrUrl && url) setErrors(e => ({ ...e, yapeQrUrl: undefined }));
                    }}
                  />
                </div>
                {errors.yapeQrUrl && (
                  <p className="text-[12px] text-red-600 font-medium mt-2 flex items-center gap-1">
                    <AlertTriangle size={12} /> {errors.yapeQrUrl}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#8B5A5A] hover:bg-[#A87474] text-white px-8 py-3.5 rounded-xl font-bold transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  );
}
