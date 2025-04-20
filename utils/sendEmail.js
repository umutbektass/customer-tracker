const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: options.email,           
        subject: options.subject,      
        text: options.message,      
    };

    // 3. E-postayı gönder
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('E-posta gönderildi: %s', info.messageId);
        return true; 
    } catch (error) {
        console.error('E-posta gönderme hatası:', error);
        return false; 
    }
};

module.exports = sendEmail;