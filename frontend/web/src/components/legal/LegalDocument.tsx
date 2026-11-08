type StoreLegalInfo = {
  storeName?: string;
  legalName?: string;
  businessRuc?: string;
  businessAddress?: string;
  contactEmail?: string;
};

function interpolate(content: string, store: StoreLegalInfo) {
  const values: Record<string, string> = {
    storeName: store.storeName || 'la tienda',
    legalName: store.legalName || store.storeName || 'la tienda',
    businessRuc: store.businessRuc || 'no informado',
    businessAddress: store.businessAddress || 'no informado',
    contactEmail: store.contactEmail || 'no informado',
  };
  return content.replace(/\{\{(storeName|legalName|businessRuc|businessAddress|contactEmail)\}\}/g, (_, key) => values[key]);
}

export function LegalDocument({ content, store }: { content: string; store: StoreLegalInfo }) {
  const sections = interpolate(content, store).split(/\n\s*\n/).map((section) => section.trim()).filter(Boolean);
  if (!sections.length) return <p className="text-gray-600">Este documento aún no ha sido publicado.</p>;
  return (
    <div className="space-y-7">
      {sections.map((section, index) => {
        const lines = section.split('\n');
        const heading = /^\d+\.\s+/.test(lines[0]) ? lines.shift() : null;
        return (
          <section key={`${index}-${heading || section.slice(0, 24)}`}>
            {heading && <h2 className="mb-2 font-serif text-2xl font-semibold text-[#8B5A5A]">{heading}</h2>}
            <p className="whitespace-pre-line leading-7 text-gray-700">{lines.join('\n')}</p>
          </section>
        );
      })}
    </div>
  );
}
