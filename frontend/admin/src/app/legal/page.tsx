'use client';
import { toast } from 'sonner';

export default function LegalPage() {
  return (
    <div className="animate-enter w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900">Documentos Legales</h1>
        <p className="text-sm text-gray-500 mt-2">Gestiona los textos legales de tu tienda en cumplimiento con la Ley N° 29733 (Protección de Datos Personales) y términos comerciales.</p>
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="text-[#8B5A5A]">⚖️</span> Políticas de Privacidad
        </h2>
        
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Contenido de Políticas (Soporta Markdown/HTML)</label>
            <textarea 
              rows={8}
              defaultValue="En PHALAY nos comprometemos a proteger la privacidad de nuestros clientes, cumpliendo con la Ley N° 29733, Ley de Protección de Datos Personales de Perú.
              
Tus datos serán utilizados exclusivamente para:
1. Procesar compras y envíos.
2. Comunicación sobre estados del pedido.
3. Envío de promociones (solo si te has suscrito)."
              className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 text-sm font-medium resize-y"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button 
              type="button" 
              onClick={() => toast.success('Políticas guardadas correctamente')}
              className="bg-[#8B5A5A] hover:bg-[#A87474] text-white px-8 py-3.5 rounded-xl font-bold transition-colors"
            >
              Guardar Políticas
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="text-[#8B5A5A]">📜</span> Términos y Condiciones
        </h2>
        
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Contenido de Términos (Soporta Markdown/HTML)</label>
            <textarea 
              rows={8}
              defaultValue="Bienvenido a PHALAY Digital Atelier.
              
Al utilizar nuestro sitio web y realizar compras, aceptas los siguientes términos:
- Los precios están expresados en Soles (S/) e incluyen IGV.
- Nos reservamos el derecho a modificar los precios en cualquier momento.
- Para solicitar devoluciones, cuentas con 7 días hábiles tras recibir el pedido, sujeto a revisión de la prenda."
              className="w-full bg-[#F8F9FA] border border-transparent rounded-xl px-4 py-3.5 focus:bg-white focus:border-[#8B5A5A] outline-none text-gray-900 text-sm font-medium resize-y"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button 
              type="button" 
              onClick={() => toast.success('Términos guardados correctamente')}
              className="bg-[#8B5A5A] hover:bg-[#A87474] text-white px-8 py-3.5 rounded-xl font-bold transition-colors"
            >
              Guardar Términos
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
