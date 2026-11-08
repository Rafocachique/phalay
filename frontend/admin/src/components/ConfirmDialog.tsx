'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, LoaderCircle } from 'lucide-react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Diálogo de confirmación único para todo el panel; reemplaza confirm(). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted) return null;

  // El portal evita que un contenedor con transform/overflow recorte el fondo
  // y garantiza que el diálogo se centre respecto de toda la ventana.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div className="w-full max-w-lg rounded-3xl border border-[#E8C5C4] bg-white p-6 shadow-2xl sm:p-7">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FBEFEF] text-[#A34D4D]">
          <AlertTriangle size={24} strokeWidth={2.3} />
        </div>
        <h2 id="confirm-dialog-title" className="text-lg font-black tracking-tight text-gray-900 sm:text-xl">{title}</h2>
        <div className="mt-2 text-sm leading-6 text-gray-500">{description}</div>
        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={busy} className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50">
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8B5A5A] px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#6A3F3F] disabled:opacity-60">
            {busy && <LoaderCircle size={16} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
