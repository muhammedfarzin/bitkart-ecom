import * as userService from "../../services/user-service.js";
import * as otpService from "../../services/otp-service.js";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";
import UserModel from "../../models/user-model.js";

dotenv.config();
const googleAuthClient = new OAuth2Client();

export const login = (req, res) => {
  const { email, password } = req.body;
  userService
    .verifyUser(email, password)
    .then((userData) => {
      req.session.user = userData;
      req.session.save();
      res.redirect(303, "/");
    })
    .catch((err) => {
      res.redirect(303, "/login?errMessage=" + err.message);
    });
};

export const signInUsingGoogle = async (req, res) => {
  try {
    const ticket = await googleAuthClient.verifyIdToken({
      idToken: req.body.credential,
      audience: process.env.GOOGLE_AUTH_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const userExist = await UserModel.findOne({ email: payload.email });
    if (userExist) {
      req.session.user = { userId: userExist._id };
    } else {
      const user = {
        name: payload.name,
        email: payload.email,
        password: payload.sub,
      };
      const response = await userService.createUser(user);
      req.session.user = response;
    }

    req.session.save();
    res.json({ redirectUrl: "/" });
  } catch (err) {
    res.status(400).json({ errMessage: err.message });
  }
};

export const signup = async (req, res) => {
  const { mobile, email, name, password } = req.body;
  try {
    if (!name || !mobile || !email || !password)
      throw new Error("All Fields are required");
    const user = await userService.checkMobileAndEmail(mobile, email);
    if (user) throw new Error(user.message);
    await otpService.sendOTP(email);
    req.session.tempUserData = { name, mobile, email, password };
    req.session.cookie.maxAge = 5 * 60000;
    req.session.save();
    res.redirect(303, "/verifyEmail");
  } catch (err) {
    res.redirect(303, "/signup?errMessage=" + err.message);
  }
};

export const showVerifyEmailPage = (req, res) => {
  if (!req.session.tempUserData)
    return res.redirect(303, "/login?errMessage=Time is over, please try again");
  res.render("user/verify-email", { errMessage: req.query.errMessage });
};

export const verfifyEmail = async (req, res) => {
  try {
    const userData = req.session.tempUserData;
    if (!userData) throw new Error("OTP EXPIRED");
    if (await otpService.verifyOTP(userData.email, req.body.otp)) {
      if (req.session.tempUserData.redirectUrl) {
        req.session.tempUserData.isOTPVerified = true;
        res.json({
          path: req.session.tempUserData.redirectUrl,
          message: "Email verified",
        });
      } else {
        const response = await userService.createUser(userData);
        req.session.user = response;
        delete req.session.tempUserData;
        res.json({ path: "/", message: "Signup successful" });
      }
    } else {
      throw new Error("Invalid OTP, please try again");
    }
  } catch (err) {
    if (err.message == "OTP EXPIRED") {
      req.session.destroy();
      res
        .status(440)
        .json({ errMessage: "Your OTP has expired, Please try again" });
    } else res.status(400).json({ errMessage: err.message });
  }
};

export const resendOtp = async (req, res) => {
  try {
    if (!req.session.tempUserData)
      return res.redirect(303, "/login?errMessage=Time is over, please try again");
    req.session.cookie.maxAge = 5 * 60000;
    await otpService.sendOTP(req.session.tempUserData.email);
    res.json({ message: "Resent OTP successfully. Kindly check your email" });
  } catch (err) {
    res
      .status(400)
      .json({ errMessage: "Something went wrong. Please try again later" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) throw new Error("Please enter email address");
    const user = await UserModel.findOne({ email });
    if (!user) throw new Error("User not found");

    await otpService.sendOTP(email);
    req.session.tempUserData = {
      email,
      userId: user._id,
      redirectUrl: "/login/setNewPassword",
    };
    req.session.cookie.maxAge = 5 * 60000;

    res.redirect(303, "/verifyEmail");
  } catch (err) {
    res.redirect(303, "/login/forgotPassword?errMessage=" + err.message);
  }
};

export const setNewPassword = async (req, res) => {
  try {
    if (!req.session.tempUserData) return res.redirect(303, "/");
    if (!req.session.tempUserData?.isOTPVerified)
      return res
        .status(400)
        .redirect(303, "/login?errMessage=Email address is not verified");

    const { userId } = req.session.tempUserData;
    await userService.updatePassword(userId, req.body.password);
    req.session.user = { userId };
    delete req.session.tempUserData;
    res.redirect(303, "/");
  } catch (err) {
    res.redirect(303, "/login/setNewPassword?errMessage=" + err.message);
  }
};

export const logout = (req, res) => {
  req.session.destroy();
  res.redirect(303, "/login");
};
