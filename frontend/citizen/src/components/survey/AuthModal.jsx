import { useState } from "react";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../../constants";

export default function AuthModal({ onVerified }) {
    const { surveyId } = useParams();
    const [step, setStep] = useState("identity"); // identity | otp
    const [mode, setMode] = useState("aadhaar");
    const [value, setValue] = useState("");
    const [otp, setOtp] = useState("");
    const [errorMsg, setErrorMsg] = useState("");


    const [loading, setLoading] = useState(false);

    const handleSendOtp = async () => {
        if (!value || !mode) return;
        setLoading(true);
        setErrorMsg("");

        try {
            const res = await fetch(`${BASE_URL}/auth/start/${surveyId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ value, mode }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

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
            const res = await fetch(`${BASE_URL}/auth/complete/${surveyId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ value, mode, otp }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            onVerified({ demographic: data.data.demographic });
        } catch (err) {
            setErrorMsg(err.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
            <div className="w-full max-w-sm border border-[#E5E5E5] rounded-xl p-6 space-y-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white">
                <div className="space-y-1">
                    <h1 className="text-[16px] font-semibold tracking-[-0.02em] text-black">Verify your identity</h1>
                    <p className="text-[13px] text-[#737373]">
                        Enter your {mode === "aadhaar" ? "Aadhaar number" : "phone number"}
                    </p>
                </div>

                {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] p-3 rounded-md">
                        <p>{errorMsg}</p>
                        <button
                            onClick={() => window.location.href = "/"}
                            className="mt-2 text-black underline"
                        >Go to Home</button>
                    </div>
                )}

                {step === "identity" && (
                    <>
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={mode === "aadhaar" ? "XXXX XXXX XXXX" : "Enter phone number"}
                            className="w-full h-10 text-black px-3 text-[14px] border border-[#E5E5E5] rounded-md outline-none focus:border-black"
                        />
                        <button onClick={handleSendOtp} disabled={loading}
                            className="w-full h-10 bg-black text-white text-[14px] rounded-md">
                            {loading ? "Sending..." : "Continue"}
                        </button>
                        <button onClick={() => setMode(mode === "aadhaar" ? "phone" : "aadhaar")}
                            className="text-[13px] text-[#737373] hover:text-black">
                            {mode === "aadhaar" ? "Use phone instead" : "Use Aadhaar instead"}
                        </button>
                    </>
                )}

                {step === "otp" && (
                    <>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                            className="w-full h-10 px-3 text-black text-[14px] border border-[#E5E5E5] rounded-md outline-none focus:border-black"
                        />
                        <button onClick={handleVerifyOtp} disabled={loading}
                            className="w-full h-10 bg-black text-white text-[14px] rounded-md">
                            {loading ? "Verifying..." : "Verify"}
                        </button>
                        <button onClick={() => setStep("identity")}
                            className="text-[13px] text-[#737373] hover:text-black">
                            Change {mode}
                        </button>
                    </>
                )}

                {/* Dev Bypass */}
                {import.meta.env.DEV && (
                    <div className="pt-4 border-t border-[#E5E5E5] mt-4">
                        <button
                            onClick={() => onVerified({ demographic: { name: "Dev User", phone: "9999999999" } })}
                            className="w-full h-8 border border-dashed border-[#A1A1A1] text-[#737373] text-[12px] rounded-md hover:border-black hover:text-black transition-colors"
                        >
                            Bypass Auth (Dev Only)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
