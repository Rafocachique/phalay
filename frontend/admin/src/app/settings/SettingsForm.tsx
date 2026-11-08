'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Store, Instagram, Facebook, Mail, MapPin, MessageCircle, ReceiptText } from 'lucide-react';
import { updateStoreSettings } from '@/app/actions/store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function normalizeWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, '');
  // Acepta el enlace antiguo wa.me/519XXXXXXXX y muestra sólo el número local.
  return digits.length >= 9 ? digits.slice(-9) : digits;
}

export default function SettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    storeName: 'PHALAY',
    storeDescription: '',
    legalName: '',
    businessRuc: '',
    businessAddress: '',
    contactEmail: '',
    contactPhone: '',
    socialLinks: {
      instagram: '',
      facebook: '',
      whatsapp: ''
    }
  });
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const resStore = await fetch(`${API_BASE_URL}/stores?t=${Date.now()}`);
      if (resStore.ok) {
        const data = await resStore.json();
        setSettings({
          storeName: data.storeName || 'PHALAY',
          storeDescription: data.storeDescription || '',
          legalName: data.legalName || '',
          businessRuc: data.businessRuc || '',
          businessAddress: data.businessAddress || '',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          socialLinks: {
            instagram: data.socialLinks?.instagram || '',
            facebook: data.socialLinks?.facebook || '',
            whatsapp: normalizeWhatsAppNumber(data.socialLinks?.whatsapp || '')
          }
        });
      }
    } catch (e) {
      toast.error("Error al cargar configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await updateStoreSettings({
        storeName: settings.storeName,
        storeDescription: settings.storeDescription,
        legalName: settings.legalName,
        businessRuc: settings.businessRuc,
        businessAddress: settings.businessAddress,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        socialLinks: settings.socialLinks,
      });
      if ('success' in result && result.success) {
        toast.success("Configuración guardada correctamente");
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        toast.error('error' in result ? result.error : 'Error al guardar la configuración');
      }
    } catch (e) {
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500 font-bold">Cargando configuración...</div>;

  return (
    <div className="space-y-8">
      {/* Información de la Tienda */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-[#FBEFEF] text-[#8B5A5A] rounded-lg flex items-center justify-center">
            <Store size={18} />
          </span>
          Información de la Tienda
        </h2>
        
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Nombre de la Marca</label>
                <input 
                  type="text" 
                  value={settings.storeName}
                  onChange={e => setSettings({...settings, storeName: e.target.value})}
                  required
                  placeholder="Ej. PHALAY" 
                  className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Descripción Corta</label>
                <textarea 
                  value={settings.storeDescription}
                  onChange={e => setSettings({...settings, storeDescription: e.target.value})}
                  placeholder="Ej. Ropa y accesorios para mujer" 
                  rows={3}
                  className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Razón social o nombre legal</label>
                <input
                  type="text"
                  value={settings.legalName}
                  onChange={e => setSettings({...settings, legalName: e.target.value})}
                  placeholder="Ej. CACHIQUE ESPINOZA RAFAEL"
                  className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">RUC</label>
                  <input
                    type="text" inputMode="numeric" maxLength={11}
                    value={settings.businessRuc}
                    onChange={e => setSettings({...settings, businessRuc: e.target.value.replace(/\D/g, '').slice(0, 11)})}
                    placeholder="20123456789"
                    className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Teléfono de contacto</label>
                  <input
                    type="tel" inputMode="numeric" maxLength={9}
                    value={settings.contactPhone}
                    onChange={e => setSettings({...settings, contactPhone: normalizeWhatsAppNumber(e.target.value)})}
                    placeholder="999 888 777"
                    className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Mail size={16} className="text-[#8B5A5A]" />
                  Correo de atención
                </label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={e => setSettings({...settings, contactEmail: e.target.value})}
                  placeholder="contacto@tumarca.pe"
                  className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <MapPin size={16} className="text-[#8B5A5A]" />
                  Domicilio comercial
                </label>
                <textarea
                  rows={2}
                  value={settings.businessAddress}
                  onChange={e => setSettings({...settings, businessAddress: e.target.value})}
                  placeholder="Dirección completa para atención de reclamos"
                  className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Instagram size={16} className="text-pink-600" />
                  Instagram URL
                </label>
                <input 
                  type="url" 
                  value={settings.socialLinks.instagram}
                  onChange={e => setSettings({...settings, socialLinks: {...settings.socialLinks, instagram: e.target.value}})}
                  placeholder="https://instagram.com/tu_cuenta" 
                  className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Facebook size={16} className="text-blue-600" />
                  Facebook URL
                </label>
                <input 
                  type="url" 
                  value={settings.socialLinks.facebook}
                  onChange={e => setSettings({...settings, socialLinks: {...settings.socialLinks, facebook: e.target.value}})}
                  placeholder="https://facebook.com/tu_pagina" 
                  className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <MessageCircle size={16} className="text-green-600" />
                  WhatsApp de atención
                </label>
                <input 
                  type="tel"
                  inputMode="numeric"
                  maxLength={9}
                  pattern="\d{9}"
                  value={settings.socialLinks.whatsapp}
                  onChange={e => setSettings({...settings, socialLinks: {...settings.socialLinks, whatsapp: normalizeWhatsAppNumber(e.target.value)}})}
                  placeholder="999 888 777"
                  className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900"
                />
                <p className="mt-1.5 text-xs text-gray-500">Ingresa sólo los 9 dígitos. Crearemos el enlace de WhatsApp automáticamente.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#EBD9D7] bg-[#FFF9F8] p-4 text-sm text-gray-600 flex gap-3">
            <ReceiptText className="mt-0.5 shrink-0 text-[#8B5A5A]" size={20} />
            <p><strong className="text-gray-900">Requisito para pagos online:</strong> completa razón social, RUC, correo y domicilio. Se publican en las páginas legales y en el Libro de Reclamaciones.</p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button type="submit" disabled={saving} className="bg-[#8B5A5A] hover:bg-[#A87474] text-white px-8 py-3.5 rounded-xl font-bold transition-colors disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
