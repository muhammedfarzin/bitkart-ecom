import otpGenerator from "otp-generator";
import OTPModel from "../model/otp-model.js";

const otpController = {
    sendOTP: async (email) => {
        try {
            const otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false
            });
            await OTPModel.findOneAndDelete({ email });
            const newOtpData = new OTPModel({ email, otp });
            await newOtpData.save();
            return { message: 'OTP sent successfully' };
        } catch (err) {
            throw new Error('Something went wrong, please try again');
        }
    },
    verifyOTP: async (email, otp) => {
        if (!otp) throw new Error('Please enter otp');
        const otpData = await OTPModel.findOne({ email: email });
        if(!otpData) throw new Error('OTP EXPIRED');
        if (!otpData.compareOtps(otp)) {
            return false;
        } else {
            return true;
        };
    }
};

export default otpController;