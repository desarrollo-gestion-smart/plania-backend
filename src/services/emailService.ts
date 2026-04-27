import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (correo, resetLink) => {
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    const result = await resend.emails.send({
      from: fromEmail,
      to: correo,
      subject: "Recuperar contraseña - Plania",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Recuperar contraseña</h2>
          <p>Recibimos una solicitud para recuperar tu contraseña.</p>
          <p>Haz clic en el siguiente enlace para establecer una nueva contraseña:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Restablecer contraseña
          </a>
          <p style="color: #666; font-size: 12px;">Este enlace expirará en 1 hora.</p>
          <p style="color: #666; font-size: 12px;">Si no solicitaste esta recuperación, ignora este correo.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 11px;">© 2024 Plania. Todos los derechos reservados.</p>
        </div>
      `,
    });

    if (result.error) {
      console.error("[sendPasswordResetEmail] Error enviando email:", result.error);
      throw new Error(`Error enviando email: ${result.error.message}`);
    }

    console.log("[sendPasswordResetEmail] Email enviado exitosamente:", { to: correo, id: result.data?.id });
    return result;
  } catch (error) {
    console.error("[sendPasswordResetEmail] Error:", error);
    throw new Error(`Error enviando email de recuperación: ${error.message}`);
  }
};
