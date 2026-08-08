export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#F8F8F8] pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6 animate-enter">
        <h1 className="text-4xl font-serif text-gray-900 mb-2">Políticas de Privacidad</h1>
        <p className="text-sm text-gray-500 mb-12">Cumplimiento de la Ley N° 29733 (Ley de Protección de Datos Personales)</p>
        
        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-gray-100 prose prose-gray max-w-none prose-headings:font-serif prose-headings:text-[#8B5A5A]">
          <h2>1. Identidad y Domicilio</h2>
          <p>
            PHALAY Digital Atelier es el titular del banco de datos personales donde se almacenará la información facilitada por los usuarios. Nos comprometemos a mantener la máxima confidencialidad y seguridad de los mismos.
          </p>

          <h2>2. Finalidad del Tratamiento de Datos</h2>
          <p>
            Tus datos personales serán utilizados única y exclusivamente para las siguientes finalidades:
          </p>
          <ul>
            <li>Procesamiento, facturación y envío de las compras realizadas en nuestro portal.</li>
            <li>Comunicación directa respecto al estado de tu pedido.</li>
            <li>Envío de promociones y boletines comerciales (únicamente si has dado tu consentimiento explícito).</li>
            <li>Atención al cliente y soporte.</li>
          </ul>

          <h2>3. Seguridad de los Datos</h2>
          <p>
            Adoptamos las medidas técnicas, organizativas y legales necesarias para garantizar la seguridad de tus datos personales y evitar su alteración, pérdida, tratamiento o acceso no autorizado. Todas las transacciones comerciales son procesadas mediante encriptación SSL de 256 bits.
          </p>

          <h2>4. Derechos ARCO</h2>
          <p>
            Como titular de tus datos personales, tienes derecho a acceder a ellos, rectificarlos, cancelarlos y oponerte a su tratamiento (Derechos ARCO). Para ejercer estos derechos, puedes enviar un correo electrónico a <strong>legal@phalay.com</strong> adjuntando copia de tu documento de identidad (DNI).
          </p>

          <h2>5. Cookies</h2>
          <p>
            Utilizamos cookies esenciales para mantener tu sesión activa y el contenido de tu carrito de compras, así como cookies analíticas anónimas para mejorar tu experiencia en nuestra plataforma.
          </p>
        </div>
      </div>
    </div>
  );
}
