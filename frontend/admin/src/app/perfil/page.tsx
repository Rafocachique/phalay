import { headers } from 'next/headers';
import PerfilForm from './PerfilForm';

export const dynamic = 'force-dynamic';

export default async function PerfilPage() {
  // El middleware ya validó la sesión contra la API y dejó estos datos en la
  // petición. No se leen desde el navegador porque las cookies son httpOnly.
  const headersList = await headers();

  return (
    <PerfilForm
      initialFirstName={headersList.get('x-user-first-name') || ''}
      initialLastName={headersList.get('x-user-last-name') || ''}
      email={headersList.get('x-user-email') || ''}
      role={headersList.get('x-user-role') || ''}
    />
  );
}
