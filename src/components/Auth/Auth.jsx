import { useState, useRef, useEffect } from 'react';
import './Auth.css';

export default function Auth({ onLoginSuccess }) {
    const [step, setStep] = useState('login'); // 'login' | 'otp'
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [countdown, setCountdown] = useState(0);

    const otpRefs = useRef([]);

    // Countdown timer for resend OTP
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Handle phone input - only numbers
    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
        setPhone(value);
        setError('');
    };

    // Handle login form submit
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        // Validate phone
        if (phone.length !== 10) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }

        // Validate password
        if (password.length < 4) {
            setError('Password must be at least 4 characters');
            return;
        }

        setLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setLoading(false);
        setSuccess('OTP sent successfully!');
        setCountdown(30);

        // Move to OTP step
        setTimeout(() => {
            setStep('otp');
            setSuccess('');
        }, 1000);
    };

    // Handle OTP input
    const handleOtpChange = (index, value) => {
        // Only allow numbers
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    // Handle OTP backspace
    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    // Handle OTP paste
    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData) {
            const newOtp = [...otp];
            for (let i = 0; i < pastedData.length; i++) {
                newOtp[i] = pastedData[i];
            }
            setOtp(newOtp);
            // Focus last filled input or last input
            const focusIndex = Math.min(pastedData.length, 5);
            otpRefs.current[focusIndex]?.focus();
        }
    };

    // Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();

        const otpValue = otp.join('');
        if (otpValue.length !== 6) {
            setError('Please enter the complete 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');

        // Simulate verification (accept any 6 digits for demo)
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Demo: Accept any OTP
        setLoading(false);
        setSuccess('Login successful! Redirecting...');

        // Save auth state
        localStorage.setItem('mm_auth', JSON.stringify({
            isLoggedIn: true,
            phone: `+91 ${phone}`,
            loginTime: new Date().toISOString()
        }));

        setTimeout(() => {
            onLoginSuccess();
        }, 1000);
    };

    // Resend OTP
    const handleResendOtp = async () => {
        if (countdown > 0) return;

        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
        setOtp(['', '', '', '', '', '']);
        setSuccess('OTP resent successfully!');
        setCountdown(30);
        setTimeout(() => setSuccess(''), 3000);
    };

    // Go back to login
    const handleBack = () => {
        setStep('login');
        setOtp(['', '', '', '', '', '']);
        setError('');
        setSuccess('');
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                {/* Logo */}
                <div className="auth-logo">
                    <div className="auth-logo-icon">💰</div>
                    <h1 className="auth-logo-text">Money Manager</h1>
                    <p className="auth-logo-sub">Premium Financial Tracker</p>
                </div>

                {step === 'login' ? (
                    /* Login Form */
                    <form className="auth-form" onSubmit={handleLogin}>
                        {/* Phone Input */}
                        <div className="auth-input-group">
                            <label className="auth-label">
                                📱 Mobile Number
                            </label>
                            <div className="phone-input-wrapper">
                                <input
                                    type="text"
                                    className="country-code"
                                    value="+91"
                                    disabled
                                />
                                <input
                                    type="tel"
                                    className="phone-input"
                                    placeholder="Enter 10-digit number"
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    maxLength={10}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="auth-input-group">
                            <label className="auth-label">
                                🔒 Password
                            </label>
                            <div className="auth-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="auth-input"
                                    style={{ paddingLeft: '16px', paddingRight: '48px' }}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="auth-error">
                                ⚠️ {error}
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className="auth-success">
                                ✅ {success}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className={`auth-submit-btn ${loading ? 'loading' : ''}`}
                            disabled={loading || phone.length !== 10 || password.length < 4}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner" />
                                    Sending OTP...
                                </>
                            ) : (
                                <>
                                    Send OTP 📲
                                </>
                            )}
                        </button>

                        {/* Demo Notice */}
                        <div className="demo-notice">
                            <p className="demo-notice-text">
                                <strong>🔓 Demo Mode</strong>
                                Enter any 10-digit number and any password.
                                <br />Any 6-digit OTP will work for verification.
                            </p>
                        </div>
                    </form>
                ) : (
                    /* OTP Verification */
                    <div className="auth-form">
                        <button className="back-btn" onClick={handleBack}>
                            ← Back to Login
                        </button>

                        <div className="otp-info">
                            <p className="otp-info-text">
                                Enter the 6-digit OTP sent to<br />
                                <span className="otp-phone">+91 {phone}</span>
                            </p>
                        </div>

                        {/* OTP Inputs */}
                        <form onSubmit={handleVerifyOtp}>
                            <div className="otp-container">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={el => otpRefs.current[index] = el}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        className={`otp-input ${digit ? 'filled' : ''}`}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        onPaste={index === 0 ? handleOtpPaste : undefined}
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="auth-error">
                                    ⚠️ {error}
                                </div>
                            )}

                            {/* Success Message */}
                            {success && (
                                <div className="auth-success">
                                    ✅ {success}
                                </div>
                            )}

                            {/* Verify Button */}
                            <button
                                type="submit"
                                className={`auth-submit-btn ${loading ? 'loading' : ''}`}
                                disabled={loading || otp.join('').length !== 6}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        Verify & Login ✓
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Resend OTP */}
                        <div className="resend-section">
                            <p className="resend-text">
                                Didn't receive OTP?{' '}
                                {countdown > 0 ? (
                                    <span className="countdown">Resend in {countdown}s</span>
                                ) : (
                                    <button
                                        className="resend-btn"
                                        onClick={handleResendOtp}
                                        disabled={loading}
                                    >
                                        Resend OTP
                                    </button>
                                )}
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="auth-footer">
                    <p className="auth-footer-text">
                        Secure login with OTP verification 🔐
                    </p>
                </div>
            </div>
        </div>
    );
}
