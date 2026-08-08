// =========================================
// Tipos de Autenticación Internos
// =========================================

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: {
    id: string;
    email: string;
    role: string;
  };
}
