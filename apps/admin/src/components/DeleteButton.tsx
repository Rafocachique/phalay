'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { deleteCatalogo } from '@/app/actions/catalog';
import { deleteProduct } from '@/app/actions/products';
import { deleteCollection } from '@/app/actions/collections';
import { deleteOrder } from '@/app/actions/orders';

interface DeleteButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'type'> {
  id: string;
  type: 'catalog' | 'product' | 'collection' | 'order';
  entityName?: string;
}

export function DeleteButton({ id, type, entityName = 'este elemento', className, children, ...props }: DeleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      let res;
      if (type === 'catalog') {
        res = await deleteCatalogo(id);
      } else if (type === 'product') {
        res = await deleteProduct(id);
      } else if (type === 'collection') {
        res = await deleteCollection(id);
      } else if (type === 'order') {
        res = await deleteOrder(id);
      }

      if (res && res.error) {
        toast.error(res.error || 'Ocurrió un error al eliminar');
      } else {
        toast.success('Eliminado correctamente');
        router.refresh();
      }
    } catch (e: any) {
      toast.error(e.message || 'Error inesperado');
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  const modalContent = isOpen && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300">
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl p-8 max-w-sm w-full transition-transform duration-300 scale-100 flex flex-col items-center text-center">
        
        {/* Warning Icon Container */}
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <AlertTriangle className="text-red-500" size={32} />
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">¿Estás seguro?</h3>
        <p className="text-[14px] text-gray-500 mb-8 leading-relaxed max-w-xs">
          Estás a punto de eliminar permanentemente <span className="font-semibold text-gray-900">{entityName}</span>. Esta acción no se puede deshacer.
        </p>

        <div className="flex gap-3 w-full">
          <button 
            type="button"
            disabled={isDeleting}
            onClick={() => setIsOpen(false)} 
            className="flex-1 px-5 py-3.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 active:scale-95 transition-all duration-200"
          >
            Cancelar
          </button>
          <button 
            type="button"
            disabled={isDeleting}
            onClick={handleDelete} 
            className="flex-1 px-5 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-red-600 to-red-500 rounded-2xl hover:from-red-700 hover:to-red-600 active:scale-95 shadow-lg shadow-red-500/20 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              'Eliminar'
            )}
          </button>
        </div>

      </div>
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        {...props}
        type="button"
        className={`inline-flex items-center gap-1.5 transition-colors duration-200 ${
          className || "text-red-500 hover:text-red-700 font-bold text-sm"
        }`}
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(true);
        }}
      >
        <Trash2 size={15} />
        {children || 'Eliminar'}
      </button>

      {mounted && typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null}
    </>
  );
}
