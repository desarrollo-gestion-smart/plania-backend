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
    const url = `http://sms.ejesatelital.com/Api/get/send.php?username=ejesatelital&password=asDsb55@@DI&to=57${to}&text=${encodeURIComponent(message)}&from=TEST&coding=8&dlr-mask=8`;
    console.log('SMS URL:', url);

    const response = await fetch(url);
    const result = await response.text();

    console.log('SMS sent:', { to, message, result });
    return result;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw new Error(`Error sending SMS: ${error.message}`);
  }
};
