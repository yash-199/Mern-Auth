import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js'

export const register = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.json({ success: false, message: "Missing Details" })
    }
    try {
        // if user exist then find
        const existingUser = await userModel.findOne({ email })
        if (existingUser) {
            return res.json({ success: false, message: "User already exist" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        if (password.length < 8) {
            return res.json({ success: false, message: "Password to small" });
        }
        // if not then create new user
        const user = new userModel({
            name, email, password: hashedPassword
        });
        await user.save();
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '2d' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE.ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            // cookie expries in 2 days
            // 7days 24 hr 60 min 60 sec 1000 milisec
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // sending welcome mail
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: "Welcome to Mern Stack",
            text: `Welcome to mern auth website. Your account has been created with email id:${email}`
        }
        await transporter.sendMail(mailOptions);
        // transporter.verify((error, success) => {
        //     if (error) {
        //         console.error("SMTP Connection Error:", error);
        //     } else {
        //         console.log("SMTP Server is ready to send emails");
        //     }
        // });


        return res.json({ success: true, message: "Registration Success" })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}


export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({ success: false, message: "Please enter email and password" })
    }
    try {
        // user exist for login
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "Invalid Email" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.json({ success: false, message: 'Invalid Password' })
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '2d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({ success: true, message: "Login Success" })

    } catch (error) {
        console.error({ success: false, message: error.message })
    }
}

export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
        })
        return res.json({ success: true, message: "Logout" })
    } catch (error) {
        console.error({ success: false, message: error.message })
    }
}


export const sendVerifyOtp = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await userModel.findById(userId);

        if (user.isAccountVerified) {
            return res.json({ success: false, message: "Account Already verified" })
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000
        await user.save();

        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account verification',
            text: `Your OTP IS ${otp}. Verify your account using this OTP.`
        }

        await transporter.sendMail(mailOption)
        res.json({ success: true, message: 'Verification OTP Sent on Email' })

    } catch (error) {
        res.json({ success: false, messsage: error.message })
    }
}

export const verifyEmail = async (req, res) => {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
        return res.json({ success: false, message: 'Missing Details' })
    }
    try {
        const user = await userModel.findById(userId)
        if (!user) {
            return res.json({ success: false, message: 'User not found' })
        }

        // if otp empty or not equal to otp
        if (user.verifyOtp === '' || user.verifyOtp !== otp) {
            return res.json({ success: false, message: 'Invaild Otp' })
        }

        // if otp expire
        if (user.verifyOtpExpireAt < Date.now) {
            return res.json({ success: false, message: 'OTP Expired' })
        }

        // user verify
        user.isAccountVerified = true
        user.verifyOtp = ''
        user.verifyOtpExpireAt = 0;
        await user.save()
        return res.json({ success: true, message: 'Email verified Successfully' })

    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}

// check if user is authenticated
export const isAuthenticated = async (req, res) => {
    try {
        return res.json({ success: true })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// send otp for reset password
// send otp for reset password
export const sendResetOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.json({ success: false, message: 'Email is required' });
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        user.resetOtp = otp; // Use correct field
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;

        await user.save();

        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password Reset OTP',
            text: `Your OTP for resetting your password is ${otp}. Use this OTP to change your password.`
        };

        await transporter.sendMail(mailOption);
        res.json({ success: true, message: 'OTP Sent on Email' });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// reset password
export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.json({ success: false, message: 'Invalid OTP, email, or password' });
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        if (!user.resetOtp || user.resetOtp !== otp) {
            return res.json({ success: false, message: 'Invalid OTP' });
        }

        if (user.resetOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: 'OTP Expired' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword; // Save the hashed password correctly
        user.resetOtp = ''; // Clear the OTP
        user.resetOtpExpireAt = 0;

        await user.save();

        return res.json({ success: true, message: "Password has been changed successfully" });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};
