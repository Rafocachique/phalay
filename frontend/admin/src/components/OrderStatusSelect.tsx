'use client';

import { updateOrderStatus } from '@/app/actions/orders';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface OrderStatusSelectProps {
  orderId: string;
  currentStatus: string;
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendiente', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { value: 'CONFIRMED', label: 'Confirmado', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { value: 'PROCESSING', label: 'En Preparación', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'SHIPPED', label: 'Enviado', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { value: 'DELIVERED', label: 'Entregado', color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'CANCELLED', label: 'Cancelado', color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'REFUNDED', label: 'Reembolsado', color: 'text-gray-600 bg-gray-50 border-gray-200' },
  { value: 'RETURNED', label: 'Devuelto', color: 'text-orange-600 bg-orange-50 border-orange-200' },
];

export default function OrderStatusSelect({ orderId, currentStatus }: OrderStatusSelectProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(currentStatus);

  // El servidor puede cambiar el estado por su cuenta (p. ej. al confirmar el
  // pago el pedido pasa a CONFIRMADO). Sin esto el desplegable se quedaba
  // mostrando el valor con el que se montó.
  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  const selectedOpt = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0];

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setLoading(true);
    const result = await updateOrderStatus(orderId, newStatus);
    setLoading(false);

    if (result?.error) {
      toast.error(result.error);
    } else {
      setStatus(newStatus);
      toast.success(`Estado del pedido ${orderId} actualizado a ${newStatus}`);
      router.refresh();
    }
  };

  return (
    <div className="relative inline-block w-40">
      <select
        value={status}
        disabled={loading}
        onChange={handleChange}
        className={`w-full appearance-none px-3 py-1.5 rounded-full text-xs font-bold border outline-none cursor-pointer transition-all pr-8 ${selectedOpt.color} ${loading ? 'opacity-50' : ''}`}
      >
        {STATUS_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value} className="text-gray-700 bg-white font-medium">
            {opt.label}
          </option>
        ))}
      </select>
      <div className={`absolute right-3.5 top-2.5 pointer-events-none w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] ${selectedOpt.color.split(' ')[0]}`} />
    </div>
  );
}
