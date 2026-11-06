import { create } from 'zustand';

interface SocialLinks {
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
}

interface StoreSettings {
  storeName: string;
  storeDescription: string;
  socialLinks: SocialLinks;
}

interface StoreSettingsState {
  settings: StoreSettings;
  setSettings: (settings: Partial<StoreSettings>) => void;
  fetchSettings: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

const getApiBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
};

let pollInterval: ReturnType<typeof setInterval> | null = null;

export const useStoreSettingsStore = create<StoreSettingsState>((set) => ({
  settings: {
    storeName: 'PHALAY',
    storeDescription: 'Moda que trasciende tendencias.',
    socialLinks: {
      instagram: '',
      facebook: '',
      whatsapp: '',
    },
  },
  setSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),
  fetchSettings: async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/stores`);
      if (res.ok) {
        const data = await res.json();
        set((state) => ({
          settings: {
            ...state.settings,
            storeName: data.storeName || 'PHALAY',
            storeDescription: data.storeDescription || 'Moda que trasciende tendencias.',
            socialLinks: {
              instagram: data.socialLinks?.instagram || '',
              facebook: data.socialLinks?.facebook || '',
              whatsapp: data.socialLinks?.whatsapp || '',
            },
          },
        }));
      }
    } catch {
      // Este store hace polling cada 10s: un fallo de red aquí es casi
      // siempre transitorio (la API reiniciando, cambio de red, etc). El
      // store ya tiene valores por defecto sensatos, así que no rompe la UI.
      // Se usa console.warn en vez de console.error para no disparar el
      // overlay de errores de Next.js por algo que no requiere atención.
      console.warn('No se pudo sincronizar la configuración de la tienda (reintentando en el próximo ciclo).');
    }
  },
  startPolling: () => {
    if (typeof window !== 'undefined' && !pollInterval) {
      const fetchFn = useStoreSettingsStore.getState().fetchSettings;
      fetchFn(); // fetch once immediately
      pollInterval = setInterval(fetchFn, 10000); // fetch every 10 seconds
    }
  },
  stopPolling: () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  },
}));
