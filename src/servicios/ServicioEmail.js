import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";

dotenv.config();

export class ServicioEmail {
  static async enviarAlerta({ email, nombre, asunto, mensaje }) {
    try {
      const defaultClient = SibApiV3Sdk.ApiClient.instance;
      const apiKey = defaultClient.authentications["api-key"];
      apiKey.apiKey = process.env.BREVO_API_KEY;

      const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

      sendSmtpEmail.subject = asunto;
      sendSmtpEmail.htmlContent = `
        <html>
          <body>
            <h1>Hola ${nombre},</h1>
            <p>${mensaje}</p>
            <br>
            <p>Atentamente,</p>
            <p><strong>Plataforma de Monitoreo de Calidad del Agua</strong></p>
          </body>
        </html>
      `;
      sendSmtpEmail.sender = {
        name: "Plataforma Monitoreo",
        email: "plataformamonitoreocalidadagua@gmail.com",
      };
      sendSmtpEmail.to = [{ email: email, name: nombre }];

      
      
      const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`📧 Correo enviado a ${email}. ID: ${data.messageId}`);
      return data;
    } catch (error) {
      console.error(
        `❌ Error al enviar correo a ${email}:`,
        error.response ? error.response.body : error.message
      );
      // No lanzamos error para no interrumpir el flujo principal de alertas
      return null;
    }
  }
}
