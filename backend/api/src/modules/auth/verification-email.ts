/**
 * Envío del correo de verificación por Resend usando fetch directo (sin SDK,
 * para no añadir una dependencia nueva sólo por esto). El código NUNCA debe
 * volver en la respuesta HTTP de ningún endpoint — sólo llega por este correo.
 */
export async function sendVerificationCodeEmail(params: {
  to: string;
  firstName: string;
  code: string;
  apiKey: string;
  from: string;
}): Promise<{ success: boolean; error?: string }> {
  const { to, firstName, code, apiKey, from } = params;

  const html = `<!DOCTYPE html>
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
              <td style="padding:24px 32px 40px 32px;color:#1a1a1a;">
                <h1 style="font-size:20px;margin:0 0 16px 0;">Hola, ${firstName} 👋</h1>
                <p style="font-size:14px;line-height:1.6;color:#555;margin:0 0 24px 0;">
                  Usa este código para confirmar tu cuenta en PHALAY. Vence en 15 minutos.
                </p>
                <div style="background:#F8F8F8;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px 0;">
                  <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:#8B5A5A;">${code}</span>
                </div>
                <p style="font-size:12px;color:#999;margin:0;">Si tú no creaste esta cuenta, puedes ignorar este correo.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to,
        subject: `${code} es tu código de verificación de PHALAY`,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, error: body?.message || `Resend respondió ${res.status}` };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido al enviar el correo.';
    return { success: false, error: message };
  }
}
