'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { deleteCatalogo } from '@/app/actions/catalog';
import { deleteProduct } from '@/app/actions/products';
import { deleteCollection } from '@/app/actions/collections';
import { deleteOrder } from '@/app/actions/orders';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface DeleteButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'type'> {
  id: string;
  type: 'catalog' | 'product' | 'collection' | 'order';
  entityName?: string;
}

export function DeleteButton({ id, type, entityName = 'este elemento', className, children, ...props }: DeleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

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

  return (
    <>
      <button
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

      <ConfirmDialog
        open={isOpen}
        title="¿Estás seguro?"
        description={<>Vas a eliminar <strong className="text-gray-900">{entityName}</strong>. Esta acción no se puede deshacer.</>}
        confirmLabel="Eliminar"
        busy={isDeleting}
        onCancel={() => setIsOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
