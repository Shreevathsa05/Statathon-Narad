import { useState } from "react";
import { auth } from "../../config/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../../constants";
import { useEffect } from "react";

export default function AuthModal({ onVerified }) {
    const { surveyId } = useParams();
    const [step, setStep] = useState("identity"); // identity | otp
    const [mode, setMode] = useState("aadhaar");
    const [value, setValue] = useState("");
    const [otp, setOtp] = useState("");

    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(
                auth,
                "recaptcha-container",
                {
                    size: "invisible",
                }
            );
        }
    }, []);

    const handleSendOtp = async () => {
        if (!value || !mode) return;
        setLoading(true);

        try {
            const res = await fetch(`${BASE_URL}/auth/start/${surveyId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ value, mode }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message);
            }

            const phone = data.data;

            const confirmationResult = ""

            window.confirmationResult = confirmationResult;
            setStep("otp");

        } catch (err) {
            setErrorMsg(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) return;

        setLoading(true);
        setErrorMsg("");

        try {
            // const result = await window.confirmationResult.confirm(otp);
            // const idToken = await result.user.getIdToken();

            const res = await fetch(`${BASE_URL}/auth/complete/${surveyId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    value,
                    mode,
                    idToken: "test",
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message);
            }

            onVerified({
                // userKey: data.data.userKey,
                demographic: data.data.demographic,
            });

        } catch (err) {
            setErrorMsg(err.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
            <div className="w-full max-w-sm border border-[#E5E5E5] rounded-md p-6 space-y-5">

                {/* Title */}
                <div className="space-y-1">
                    <h1 className="text-[16px] font-medium text-black">
                        Verify your identity
                    </h1>
                    <p className="text-[13px] text-[#737373]">
                        Enter your {mode === "aadhaar" ? "Aadhaar number" : "phone number"}
                    </p>
                </div>
                <div id="recaptcha-container"></div>
                {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] p-3 rounded-md">
                        <p>{errorMsg}</p>

                        <button
                            onClick={() => window.location.href = "/"}
                            className="mt-2 text-black underline"
                        >
                            Go to Home
                        </button>
                    </div>
                )}
                {/* Identity Step */}
                {step === "identity" && (
                    <>
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={mode === "aadhaar" ? "XXXX XXXX XXXX" : "Enter phone number"}
                            className="w-full h-10 text-black px-3 text-[14px] border border-[#E5E5E5] rounded-md outline-none focus:border-black"
                        />

                        <button
                            onClick={handleSendOtp}
                            disabled={loading}
                            className="w-full h-10 bg-black text-white text-[14px] rounded-md"
                        >
                            {loading ? "Sending..." : "Continue"}
                        </button>

                        <button
                            onClick={() => setMode(mode === "aadhaar" ? "phone" : "aadhaar")}
                            className="text-[13px] text-[#737373] hover:text-black"
                        >
                            {mode === "aadhaar"
                                ? "Use phone instead"
                                : "Use Aadhaar instead"}
                        </button>
                    </>
                )}

                {/* OTP Step */}
                {step === "otp" && (
                    <>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                            className="w-full h-10 px-3 text-black text-[14px] border border-[#E5E5E5] rounded-md outline-none focus:border-black"
                        />

                        <button
                            onClick={handleVerifyOtp}
                            disabled={loading}
                            className="w-full h-10 bg-black text-white text-[14px] rounded-md"
                        >
                            {loading ? "Verifying..." : "Verify"}
                        </button>

                        <button
                            onClick={() => setStep("identity")}
                            className="text-[13px] text-[#737373] hover:text-black"
                        >
                            Change {mode}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}