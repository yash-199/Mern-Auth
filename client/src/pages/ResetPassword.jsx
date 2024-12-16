import React, { useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { AppContent } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";


const ResetPassword = () => {
    const navigate = useNavigate();

    axios.defaults.withCredentials = true;
    const { backendUrl } = useContext(AppContent);

    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isEmailSent, setIsEmailSent] = useState('');
    const [otp, setOtp] = useState(0);
    const [optSubmited, setOtpSubmited] = useState(false);


    const inputRefs = React.useRef([])

    const handleInput = (e, index) => {
        if (e.target.value.length > 0 && index < inputRefs.current.length - 1) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        const paste = e.clipboardData.getData('text');
        const pasteArray = paste.split('');
        pasteArray.forEach((char, index) => {
            if (inputRefs.current[index]) {
                inputRefs.current[index].value = char;
            }
        });
    };

    const handleEmailSubmit = (e) => {
        e.preventDefault();
        // Add logic to send email and show OTP form
        // setShowOtpForm(true);
    };

    // const handleOtpSubmit = (e) => {
    //     e.preventDefault();
    //     // Add logic to verify OTP
    //     navigate('/reset-password-success'); // Example navigation after successful verification
    // };

    const onSubmitEmail = async (e) => {
        e.preventDefault()
        try {
            const { data } = await axios.post(backendUrl + '/api/auth/send-resendOtp', { email })

            data.success ? toast.success(data.message) : toast.error(data.message)
            data.success && setIsEmailSent(true)

        } catch (error) {
            toast.error(error.message)
        }
    }


    const onSubmitOtp = async (e) => {
        e.preventDefault();
        const otpArray = inputRefs.current.map(e => e.value)
        setOtp(otpArray.join(''))
        setOtpSubmited(true)
    }

    const onSubmitNewPassword = async (e) => {
        e.preventDefault()
        try {
            const { data } = await axios.post(backendUrl + '/api/auth/reset-password', { email, otp, newPassword })
            data.success ? toast.success(data.message) : toast.error(data.message)
            data.success && navigate('/login')
        } catch (error) {
            toast.error(error.message)
        }
    }


    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-200 to-purple-400">
            <img
                src={assets.logo}
                alt=""
                className="absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer"
            />



            {/* // Email Form */}
            {!isEmailSent &&
                <form onSubmit={onSubmitEmail} className="bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm">
                    <h1 className="text-white text-2xl font-semibold text-center mb-4">Reset Password</h1>
                    <p className="text-center mb-6 text-indigo-300">
                        Enter your registered email address
                    </p>
                    <div className="mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]">
                        <img src={assets.mail_icon} alt="" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email-Id"
                            className="bg-transparent outline-none text-white"
                            required
                        />
                    </div>
                    <button className="py-2 w-full bg-white text-black rounded">Submit</button>
                </form>
            }

            {/* // OTP Form */}
            {!optSubmited && isEmailSent &&
                <form className="bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm" onSubmit={onSubmitOtp}>
                    <h1 className="text-white text-2xl font-semibold text-center mb-4">
                        Reset Password OTP
                    </h1>
                    <p className="text-center mb-6 text-indigo-300">
                        Enter the 6-digit code sent to your email id.
                    </p>
                    <div className="flex justify-between mb-8" onPaste={handlePaste}>
                        {Array(6)
                            .fill(0)
                            .map((_, index) => (
                                <input
                                    type="text"
                                    maxLength="1"
                                    key={index}
                                    required
                                    className="w-12 h-12 bg-[#333A5C] text-white text-center text-xl rounded-md"
                                    ref={(e) => (inputRefs.current[index] = e)}
                                    onInput={(e) => handleInput(e, index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                />
                            ))}
                    </div>
                    <button className="w-full py-3 bg-white text-black rounded">Verify Email</button>
                </form>
            }
            {/* enter new password */}
            {optSubmited && isEmailSent &&
                <form className="bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm" onSubmit={onSubmitNewPassword}>
                    <h1 className="text-white text-2xl font-semibold text-center mb-4">Reset Password</h1>
                    <p className="text-center mb-6 text-indigo-300">
                        Enter your New Password
                    </p>
                    <div className="mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]">
                        <img src={assets.lock_icon} alt="" />
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New Password"
                            className="bg-transparent outline-none text-white"
                            required
                        />
                    </div>
                    <button className="py-2 w-full bg-white text-black rounded">Submit</button>
                </form>
            }
        </div>
    );
};

export default ResetPassword;
