export const sendPasswordResetEmail = async (correo, resetLink) => {
  try {
    const { createTransport } = await import("nodemailer");

    const transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
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
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("[sendPasswordResetEmail] Email enviado exitosamente:", { to: correo, messageId: result.messageId });
    return result;
  } catch (error) {
    console.error("[sendPasswordResetEmail] Error:", error);
    throw new Error(`Error enviando email de recuperación: ${error.message}`);
  }
};
