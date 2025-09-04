const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    enabled: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String
    },
    githubLink: {
        type: String
    },
    linkedin: {
        type: String
    },
    portfolio: {
        type: String
    },
    facebook: {
        type: String
    },
    instagram: {
        type: String
    },

    verificationToken: {
        type: String
    },
    verificationTokenExpires: {
        type: Date
    },
    graduationYear: {
        type: String
    },
    currentCompony: {
        type: String
    },
    regNo: {
        type: String
    },
    yearOfStudy: {
        type: String
    },
    branchOfStudy: {
        type: String
    },
}, {
    timestamps: true
});

userSchema.pre('save', async function (next) {
    const user = this;

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 10);
    }
    next();
});

userSchema.methods.isPasswordMatch = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
