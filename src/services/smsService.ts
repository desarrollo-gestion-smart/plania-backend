// import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

// const snsClient = new SNSClient({
//   region: 'sa-east-1', // región válida
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// export const sendSMS = async (to, message) => {
//   try {
//     const params = {
//       PhoneNumber: `54${to}`,
//       Message: message,
//     };

//     const command = new PublishCommand(params);
//     const result = await snsClient.send(command);

//     console.log('✅ SMS enviado:', { to, message, result });
//     return result;
//   } catch (error) {
//     console.error('❌ Error enviando SMS vía AWS SNS:', error);
//     throw new Error(`Error enviando SMS: ${error.message}`);
//   }
// };

export const sendSMS = async (to, message) => {
  try {
    // Clean phone number: remove +54 if present, add 54 prefix for Argentina
    let phoneNumber = String(to).trim();
    if (phoneNumber.startsWith("+54")) {
      phoneNumber = phoneNumber.slice(1); // Remove + but keep 54
    } else if (!phoneNumber.startsWith("54")) {
      phoneNumber = `54${phoneNumber}`; // Add 54 prefix if missing
    }

    const url = `http://sms.ejesatelital.com/Api/get/send.php?username=ejesatelital&password=asDsb55@@DI&to=${phoneNumber}&text=${encodeURIComponent(message)}&from=TEST&coding=8&dlr-mask=8`;
    console.log('[sendSMS] Enviando SMS a Argentina:', { phoneNumber, message });

    const response = await fetch(url);
    const result = await response.text();

    console.log('[sendSMS] SMS enviado exitosamente:', { phoneNumber, message, result });
    return result;
  } catch (error) {
    console.error('[sendSMS] Error enviando SMS:', error);
    throw new Error(`Error sending SMS: ${error.message}`);
  }
};
