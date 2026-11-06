import { redirect } from 'next/navigation';

export default function AdminRegisterPage() {
  // Deshabilitar registro público de administradores por seguridad.
  // Los nuevos usuarios de administración solo se pueden crear desde el panel interno por un administrador.
  redirect('/login');
}
