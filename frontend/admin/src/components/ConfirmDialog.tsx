'use client';

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div className="w-full max-w-md rounded-[2rem] border border-[#E8C5C4] bg-white p-7 shadow-2xl sm:p-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBEFEF] text-[#A34D4D]">
          <AlertTriangle size={27} strokeWidth={2.3} />
        </div>
        <h2 id="confirm-dialog-title" className="text-xl font-black tracking-tight text-gray-900">{title}</h2>
        <div className="mt-2 text-sm leading-6 text-gray-500">{description}</div>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={busy} className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50">
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8B5A5A] px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#6A3F3F] disabled:opacity-60">
            {busy && <LoaderCircle size={16} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
