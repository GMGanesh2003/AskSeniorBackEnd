const express = require('express');
const { validate } = require("./../middleware/validator")
const loginSchema = require("./../validators/loginSchema");
const registerSchema = require("./../validators/registerSchema");
const validateAuthToken = require("../middleware/AuthMiddleware");
const {
    login,
    registerUser,
    resendActivationMail,
    activateUser,
    currentUser,
    logout,
    changePassword,
    forgotPassword,
    setPassword
} = require("./../controllers/AuthController");

const router = express.Router();

router.post('/login', validate(loginSchema), login);
router.post('/resend-activation',resendActivationMail);
router.post('/register', registerUser);
router.post('/forgot-password', forgotPassword);
router.put('/activate/:token', activateUser);
router.put('/set-password', setPassword);

router.post('/change-password', validateAuthToken, changePassword);
router.get('/current', validateAuthToken, currentUser);
router.post('/logout', validateAuthToken, logout);

module.exports = router;
