'use client';
import { useState, useRef } from 'react';
import { Upload, X, Check, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  name: string;
  label?: string;
  currentUrl?: string;
  onUrlChange?: (url: string) => void;
}

export default function ImageUpload({ name, label = 'Imagen', currentUrl = '', onUrlChange }: ImageUploadProps) {
  const [preview, setPreview] = useState<string>(currentUrl || '');
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(currentUrl || '');
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [uploaded, setUploaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);

    // Preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      // Upload to API which stores in Supabase Storage
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const { url } = await res.json();
        setPreview(url);
        setUrlInput(url);
        onUrlChange?.(url);
        setUploaded(true);
        setTimeout(() => setUploaded(false), 2000);
      }
    } catch {
      // Fallback: keep local preview, URL stays as data URL
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleUrlSubmit = () => {
    if (urlInput && urlInput.trim()) {
      setPreview(urlInput.trim());
      onUrlChange?.(urlInput.trim());
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-gray-900">{label}</label>

      {/* Mode Toggle */}
      <div className="flex gap-2 text-xs">
        <button type="button" onClick={() => setMode('upload')}
          className={`px-3 py-1.5 rounded-full font-bold transition-colors ${mode === 'upload' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Subir Archivo
        </button>
        <button type="button" onClick={() => setMode('url')}
          className={`px-3 py-1.5 rounded-full font-bold transition-colors ${mode === 'url' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          URL Externa
        </button>
      </div>

      {/* Upload Zone */}
      {mode === 'upload' && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="relative border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#8B5A5A] hover:bg-[#8B5A5A]/5 transition-colors min-h-[160px]"
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Loader2 size={32} className="animate-spin text-[#8B5A5A]" />
              <span className="text-sm font-medium">Subiendo imagen...</span>
            </div>
          ) : uploaded ? (
            <div className="flex flex-col items-center gap-2 text-green-600">
              <Check size={32} />
              <span className="text-sm font-medium">¡Imagen subida!</span>
            </div>
          ) : (
            <>
              <Upload size={28} className="text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">Arrastra una imagen aquí</p>
              <p className="text-xs text-gray-400 mt-1">o haz clic para seleccionar · JPG, PNG, WebP</p>
            </>
          )}
        </div>
      )}

      {/* URL Input */}
      {mode === 'url' && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput || ''}
            onChange={e => setUrlInput(e.target.value)}
            placeholder="https://..."
            className="flex-1 bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3 focus:bg-white focus:border-[#8B5A5A] outline-none text-sm"
          />
          <button type="button" onClick={handleUrlSubmit}
            className="bg-[#8B5A5A] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#6A3F3F] transition-colors">
            Aplicar
          </button>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="relative w-full h-64 rounded-xl overflow-hidden bg-gray-50 border border-gray-200/80 flex items-center justify-center p-2">
          <img src={preview} alt="Vista previa" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
          <button type="button"
            onClick={() => { setPreview(''); setUrlInput(''); onUrlChange?.(''); }}
            className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black text-white rounded-full flex items-center justify-center transition-colors shadow-md">
            <X size={16} />
          </button>
          <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] px-2.5 py-1 rounded font-bold">Vista previa</div>
        </div>
      )}

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={urlInput || ''} />
    </div>
  );
}
