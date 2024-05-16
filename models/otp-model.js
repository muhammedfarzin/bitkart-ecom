import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import mailSender from "../helpers/mail-sender.js";

const otpSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '5m'
    }
});

async function sendVerificationEmail(email, otp) {
    const mailResponse = await mailSender(
        email,
        'Bitkart Verification Email',
        `<h1>Please confirm your OTP</h1>
         <p>Here is your OTP code: ${otp}</p>`
    );
    return mailResponse;
}

otpSchema.pre('save', async function (next) {
    await sendVerificationEmail(this.email, this.otp)
    this.otp = await bcrypt.hash(this.otp, 10);
    next();
});

otpSchema.methods.compareOtps = function (enteredOtp) {
    return bcrypt.compareSync(enteredOtp, this.otp);
}

const OTPModel = model('OTP', otpSchema);

export default OTPModel;