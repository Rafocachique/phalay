function layout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#F8F8F8;font-family:Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 0 32px;">
                <span style="font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#8B5A5A;">PHALAY</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;color:#1a1a1a;">
                <h1 style="font-size:20px;margin:0 0 16px 0;">${title}</h1>
                ${bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#8B5A5A;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:14px 28px;border-radius:10px;">${label}</a>`;
}

export function accountVerificationEmail(params: { firstName: string; verifyUrl: string }): { subject: string; html: string } {
  const { firstName, verifyUrl } = params;
  return {
    subject: 'Confirma tu cuenta en PHALAY',
    html: layout(
      `Hola, ${firstName} 👋`,
      `<p style="font-size:14px;line-height:1.6;color:#555;margin:0 0 24px 0;">
         Gracias por crear tu cuenta en PHALAY. Confirma tu correo para poder iniciar sesión y hacer seguimiento a tus pedidos.
       </p>
       <p style="margin:0 0 24px 0;">${ctaButton(verifyUrl, 'Confirmar mi cuenta')}</p>
       <p style="font-size:12px;color:#999;margin:0;">Si tú no creaste esta cuenta, puedes ignorar este correo.</p>`,
    ),
  };
}

export function welcomeEmail(params: { firstName: string; shopUrl: string }): { subject: string; html: string } {
  const { firstName, shopUrl } = params;
  return {
    subject: '¡Bienvenida a PHALAY!',
    html: layout(
      `¡Hola, ${firstName}! 🎉`,
      `<p style="font-size:14px;line-height:1.6;color:#555;margin:0 0 24px 0;">
         Tu cuenta en PHALAY ya está creada. Revisa tu bandeja de entrada por el correo de Supabase para confirmar tu dirección
         y así puedas iniciar sesión sin problemas.
       </p>
       <p style="margin:0 0 24px 0;">${ctaButton(shopUrl, 'Explorar el catálogo')}</p>`,
    ),
  };
}

export function passwordResetEmail(params: { firstName: string; resetUrl: string }): { subject: string; html: string } {
  const { firstName, resetUrl } = params;
  return {
    subject: 'Recupera tu contraseña de PHALAY',
    html: layout(
      `Hola, ${firstName}`,
      `<p style="font-size:14px;line-height:1.6;color:#555;margin:0 0 24px 0;">
         Recibimos una solicitud para restablecer tu contraseña. Si fuiste tú, crea una nueva desde este enlace (válido por 1 hora).
       </p>
       <p style="margin:0 0 24px 0;">${ctaButton(resetUrl, 'Restablecer contraseña')}</p>
       <p style="font-size:12px;color:#999;margin:0;">Si tú no pediste esto, ignora este correo — tu contraseña actual sigue siendo válida.</p>`,
    ),
  };
}
