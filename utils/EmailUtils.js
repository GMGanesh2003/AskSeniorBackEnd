const nodemailer = require('nodemailer');
const handlebars = require("handlebars");
const path = require('path');
const fs = require('fs');
require("dotenv").config();

function getCompiledTemplate(templateName, replacements) {
    
    const filePath = path.join(__dirname, '..', 'public', templateName);
    console.log(filePath);
    
    if (!fs.existsSync(filePath)) {
        console.error(`Template file ${templateName} not found.`);
        return '';
    }
    const source = fs.readFileSync(filePath, 'utf8');
    const template = handlebars.compile(source);

    return template(replacements);
}

async function sendEmail(to, subject, templateName, replacements) {    
    const html = getCompiledTemplate(templateName, replacements)
    
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: false,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: `"Admin | AskSeniors" <${process.env.EMAIL_USERNAME}>`,
        to,
        subject,
        html,
    };
    
    return await transporter.sendMail(mailOptions);
}

module.exports = sendEmail
