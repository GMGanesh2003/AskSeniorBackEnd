const sendEmail = require("../utils/EmailUtils");
const { v4: uuidv4 } = require('uuid');

const sendActivationEmail = async (user, baseUrl) => {
    
    try {
        const token = uuidv4();
    
        user.verificationTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
        user.verificationToken = token;
    
        const u = await user.save()
    
        await sendEmail(user.email, `Account Activation Email - ${user.username}`, "activation.html", {
            userName: user.username,
            link: `${baseUrl}/api/v1/auth/activate/${token}`
        })

        return {
            status: true
        };
    } catch (error) {
        return {
            status: false,
            error
        }
    }
}

const sendForgotPasswordEmail = async (user, baseUrl) => {
    
    try {
        const token = uuidv4();
    
        user.verificationTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
        user.verificationToken = token;
    
        const u = await user.save()
    
        await sendEmail(user.email, `Forgot Password Email - ${user.username}`, "forgot-password.html", {
            userName: user.username,
            link: `${baseUrl}/api/v1/auth/set-password/${token}`
        })

        return {
            status: true
        };
    } catch (error) {
        return {
            status: false,
            error
        }
    }
}


module.exports = {
    sendActivationEmail,
    sendForgotPasswordEmail
}