import nodemailer from "nodemailer";

async function mailSender(email, title, body) {
    // Create a Transporter to send emails
    let transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    });

    // Send email to the Users
    let info = await transporter.sendMail({
        from: 'Bitkart',
        to: email,
        subject: title,
        html: body,
    });
    return info;
}

export default mailSender;