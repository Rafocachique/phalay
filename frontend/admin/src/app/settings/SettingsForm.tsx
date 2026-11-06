'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Store, Instagram, Facebook, MessageCircle } from 'lucide-react';
import { updateStoreSettings } from '@/app/actions/store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function SettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    storeName: 'PHALAY',
    storeDescription: '',
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
          socialLinks: {
            instagram: data.socialLinks?.instagram || '',
            facebook: data.socialLinks?.facebook || '',
            whatsapp: data.socialLinks?.whatsapp || ''
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
            </div>

            <div className="space-y-6">
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
                  WhatsApp URL
                </label>
                <input 
                  type="url" 
                  value={settings.socialLinks.whatsapp}
                  onChange={e => setSettings({...settings, socialLinks: {...settings.socialLinks, whatsapp: e.target.value}})}
                  placeholder="https://wa.me/51999999999" 
                  className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900"
                />
              </div>
            </div>
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
