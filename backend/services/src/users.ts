import { prisma, UserRole } from '@phalay/database';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase URL o Service Role Key no configurada');
  }
  return createClient(url, key);
}

export const usersService = {
  async findAll() {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  },

  async getStats() {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [totalUsers, totalCustomers, newThisMonth, newPrevMonth] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { createdAt: { gte: startOfThisMonth } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfPrevMonth, lt: startOfThisMonth } } }),
    ]);

    return { totalUsers, totalCustomers, newThisMonth, newPrevMonth };
  },

  async findOne(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) throw new Error('Usuario no encontrado');
    return user;
  },

  async create(data: {
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    status?: 'ACTIVE' | 'INACTIVE';
    password?: string;
  }) {
    const email = (data.email || '').trim().toLowerCase();

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    if (existingUser) {
      throw new Error('El correo electrónico ya está registrado');
    }

    const tempPassword = data.password || Math.random().toString(36).slice(-8) + 'aA1!';
    const supabase = getSupabaseAdmin();

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Error al crear usuario en Supabase Auth');
    }

    const user = await prisma.user.create({
      data: {
        email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        status: data.status || 'ACTIVE',
        emailVerified: true,
        supabaseAuthId: authData.user.id,
      },
    });

    return { user, tempPassword };
  },

  async update(id: string, data: any, requesterId?: string) {
    if (requesterId === id && (data.role || data.status)) {
      throw new Error('No puedes cambiar tu propio rol ni desactivar tu cuenta.');
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('Usuario no encontrado');

    if (data.password) {
      const supabase = getSupabaseAdmin();
      await supabase.auth.admin.updateUserById(user.supabaseAuthId, {
        password: data.password,
      });
    }

    return prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName !== undefined ? data.firstName : undefined,
        lastName: data.lastName !== undefined ? data.lastName : undefined,
        role: data.role !== undefined ? data.role : undefined,
        status: data.status !== undefined ? data.status : undefined,
      },
    });
  },

  async remove(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('Usuario no encontrado');

    try {
      const supabase = getSupabaseAdmin();
      await supabase.auth.admin.deleteUser(user.supabaseAuthId);
    } catch {
      // Continuar si ya no existía en Supabase
    }

    return prisma.user.delete({ where: { id } });
  },
};
