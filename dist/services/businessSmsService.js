// AWS SNS method (commented out)
// import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
// export const sendBusinessSMS = async (to, message) => {
//   const snsClient = new SNSClient({
//     region: process.env.AWS_REGION ,
//     credentials: {
//       accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     },
//   });
//   try {
//     const params = {
//       PhoneNumber: `+54${to}`, // Argentina format E.164
//       Message: message,
//     };
//     const command = new PublishCommand(params);
//     const result = await snsClient.send(command);
//     console.log('✅ Business SMS sent:', { to, message, result });
//     return result;
//   } catch (error) {
//     console.error('❌ Error sending business SMS via AWS SNS:', error);
//     throw new Error(`Error sending business SMS: ${error.message}`);
//   }
// };
export const sendBusinessSMS = async (to, message) => {
    try {
        const url = `http://sms.ejesatelital.com/Api/get/send.php?username=ejesatelital&password=asDsb55@@DI&to=57${to}&text=${encodeURIComponent(message)}&from=TEST&coding=8&dlr-mask=8`;
        const response = await fetch(url);
        const result = await response.text();
        console.log('✅ Business SMS sent:', { to, message, result });
        return result;
    }
    catch (error) {
        console.error('❌ Error sending business SMS:', error);
        throw new Error(`Error sending business SMS: ${error.message}`);
    }
};
//# sourceMappingURL=businessSmsService.js.map