const { StatusCodes } = require('http-status-codes');
const User = require("./../models/UserModel");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const { sendActivationEmail, sendForgotPasswordEmail } = require('../lib/Email');

const login = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid email or password' });
    }

    if (!user.enabled) {
        // TODO: send activation
        return res.status(StatusCodes.FORBIDDEN).json({ error: "your user account is not activate. Please check your email inbox" })
    }

    const token = jwt.sign(
        {
            id: user._id,
            email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: '6h' }
    );

    res.cookie('authToken', token, { httpOnly: true, secure: true, sameSite: 'none', partitioned: true, maxAge: 3600000, path: "/" });
    res.json({ message: 'Logged in successfully' });

};

const currentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password'); // Don't return password
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}

const logout = (req, res) => {
    res.cookie('authToken', '', {
        httpOnly: true,
        secure: false,
        maxAge: 0,
    });
    res.status(StatusCodes.ACCEPTED).json({ message: 'Logged out successfully' });
}

const registerUser = async (req, res) => {
    console.log(req.body);

    const { email, username, role, regNo, currentYear, branchOfStudy, graduationYear } = req.body;

    if (!/^[a-zA-Z0-9._%+-]+@(vitapstudent\.ac\.in|vitap\.ac\.in)$/.test(email)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'use university mail id' });
    }

    try {
        const existingUser = await User.findOne({
            $or: [
                { email: email },
                { username: username }
            ]
        });
        console.log("existingUser : ", existingUser);

        if (existingUser) {
            return res.status(StatusCodes.CONFLICT).json({ error: 'Username or email already in use' });
        }

        if ("STUDENT" === role) {
            console.log(regNo, "  ", currentYear, "  ", branchOfStudy);

            if (!regNo || !currentYear || !branchOfStudy) {
                return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json({
                        error: "For creating student account registration number, current year and branch of study are required"
                    })
            }
        }
        else if ("ALUMNI" === role) {
            if (!graduationYear || !branchOfStudy) {
                return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json({
                        error: "For creating alumni account graduation year and branch of study are required"
                    })
            }
        }
        else {
            if (!branchOfStudy) {
                return res
                    .status(StatusCodes.BAD_REQUEST)
                    .json({
                        error: "For creating faculty account branch of study are required"
                    })
            }
        }

        const newUser = new User(req.body);
        await newUser.save();

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        sendActivationEmail(newUser, baseUrl);

        const userResponse = {
            _id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role
        };

        return res.status(StatusCodes.CREATED).json({ message: 'User registered successfully. Please check your email to activate your account', user: userResponse });
    } catch (error) {
        console.error(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server error during registration' });
    }
};

const resendActivationMail = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: `email is required` });
    }

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: `user not found with email : ${email}` });
    }

    if (user.enabled) {
        return res.status(StatusCodes.OK).json({ message: `user with email (${email}) already activated` });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const response = await sendActivationEmail(user, baseUrl);

    if (response.status) {
        return res.status(StatusCodes.ACCEPTED).json({
            message: "activation mail send successfully.....!!!"
        })
    }
    else {
        return {
            error: response.error
        }
    }
}

const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: `email is required` });
    }

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: `user not found with email : ${email}` });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const response = await sendForgotPasswordEmail(user, baseUrl);

    if (response.status) {
        return res.status(StatusCodes.OK).json({
            message: "forgot mail send successfully.....!!!"
        })
    }
    else {
        return {
            error: response.error
        }
    }

}

const activateUser = async (req, res) => {
    const { token } = req.params;

    if (!token) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            error: "Token is required"
        })
    }

    const user = await User.findOne({
        verificationToken: token,
        verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'The link was expired' });
    }

    user.enabled = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.status(StatusCodes.OK).json({ message: 'user account activated successfully' });
};

const setPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            error: "Token and newPassword are required"
        })
    }

    const user = await User.findOne({
        verificationToken: token,
        verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'The link was expired' });
    }

    user.password = newPassword;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.status(StatusCodes.OK).json({ message: 'user account activated successfully' });
};

const changePassword = async (req, res) => {
    const { currentPassword, newPassword, reEnterPassword } = req.body;


    if (!currentPassword || !newPassword || !reEnterPassword) {
        return res.status(400).json({ error: 'Current password, new password, and re-entered password are required' });
    }


    if (newPassword !== reEnterPassword) {
        return res.status(400).json({ error: 'New password and re-entered password must match' });
    }

    try {

        const user = await User.findById(req.user.id);


        const isMatch = await user.isPasswordMatch(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error changing password', error });
    }
};

module.exports = {
    login,
    logout,
    setPassword,
    currentUser,
    activateUser,
    registerUser,
    forgotPassword,
    changePassword,
    resendActivationMail,
}