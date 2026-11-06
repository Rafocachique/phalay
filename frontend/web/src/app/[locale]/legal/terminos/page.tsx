export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[#F8F8F8] pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6 animate-enter">
        <h1 className="text-4xl font-serif text-gray-900 mb-2">Términos y Condiciones</h1>
        <p className="text-sm text-gray-500 mb-12">Última actualización: Noviembre 2024</p>
        
        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-gray-100 prose prose-gray max-w-none prose-headings:font-serif prose-headings:text-[#8B5A5A]">
          <h2>1. Aspectos Generales</h2>
          <p>
            Bienvenido a PHALAY Digital Atelier. Al utilizar nuestro sitio web y realizar compras, aceptas los siguientes términos comerciales que regulan el uso de nuestra plataforma e-commerce operada en Perú.
          </p>

          <h2>2. Precios y Pagos</h2>
          <p>
            Todos los precios mostrados en el catálogo están expresados en Soles (S/) e incluyen el Impuesto General a las Ventas (IGV) vigente en el territorio peruano. Nos reservamos el derecho a modificar los precios en cualquier momento sin previo aviso, sin embargo, los pedidos ya procesados respetarán el precio al momento de la compra.
          </p>
          <p>
            Aceptamos pagos mediante:
          </p>
          <ul>
            <li>Yape / Plin</li>
            <li>Tarjetas de Crédito/Débito</li>
            <li>Transferencias Bancarias (BCP, BBVA, Interbank)</li>
          </ul>

          <h2>3. Envíos y Entregas</h2>
          <p>
            Realizamos envíos a nivel nacional. Los tiempos de entrega estimados son de 2 a 3 días hábiles para Lima Metropolitana y de 5 a 7 días hábiles para provincias, contados a partir de la validación del pago.
          </p>

          <h2>4. Cambios y Devoluciones</h2>
          <p>
            Conforme a nuestras políticas de satisfacción, cuentas con 7 días calendario tras recibir el pedido para solicitar un cambio de talla o devolución. La prenda debe estar sin uso, con etiquetas originales y en perfecto estado. Los costos de envío por cambios no atribuibles a fallas de fábrica serán asumidos por el cliente.
          </p>
        </div>
      </div>
    </div>
  );
}
