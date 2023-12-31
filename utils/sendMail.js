import nodemailer from "nodemailer";

export const sendMail = async (email, subject, text) => {
    const transport = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE,
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        }
    });
    await transport.sendMail({
        from: process.env.SMTP_FROM_USER,
        to: email,
        subject: subject,
        text: text,
    });
}