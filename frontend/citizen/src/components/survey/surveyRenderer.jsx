"use client";

import { useState } from "react";
import DynamicField from "@/components/survey/DynamicField";
import { shouldShowField } from "@/components/survey/ConditionEvaluator";
import { BASE_URL } from "@/constants";
import { useRouter } from "next/navigation";
import { speak } from "@/lib/textToSpeech";

export default function SurveyRenderer({ questions, supportedLanguages, surveyId }) {
	const [answers, setAnswers] = useState({});
	const [loading, setLoading] = useState(false);
	const [consent, setConsent] = useState(null);

	const [userInfo, setUserInfo] = useState({
		fullname: "",
		phone_no: "",
	});

	const [language, setLanguage] = useState("english");
	const router = useRouter();
	const [currentSpeak, setCurrentSpeak] = useState(null);
	const handleChange = (qid, value) => {
		setAnswers((prev) => ({ ...prev, [qid]: value }));
	};

	const handleUserChange = (field, value) => {
		setUserInfo((prev) => ({ ...prev, [field]: value }));
	};

	const handleSpeakQuestion = async (field) => {
		if (!field.text?.[language]) return;

		setCurrentSpeak(field.qid);
		window.speechSynthesis.cancel();

		await speak(field.text[language], language);

		if (Array.isArray(field.options)) {
			for (const opt of field.options) {
				if (opt.label?.[language]) {
					await speak(opt.label[language], language);
				}
			}
		}
	};

	const handleSubmit = async () => {
		if (loading) return;

		if (!userInfo.fullname || !userInfo.phone_no) {
			alert("Please enter your name and phone number");
			return;
		}

		const response = questions
			.filter((q) => shouldShowField(q, answers))
			.map((q) => {
				const answer = answers[q.qid];
				if (!answer) return null;

				if (q.type === "mcq") return { qid: q.qid, optionId: answer };
				return { qid: q.qid, value: answer };
			})
			.filter(Boolean);

		if (response.length === 0) {
			alert("No responses to submit");
			return;
		}

		setLoading(true);

		try {
			const res = await fetch(`${BASE_URL}/response/${surveyId}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ response, user: userInfo }),
			});

			if (!res.ok) {
				const json = await res.json();
				alert(json.message || "Submission failed");
				return;
			}

			router.push("/");
		} catch {
			alert("Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	const handleConsent = (val) => {
		setConsent(val);
		if (!val) {
			router.push("/")
		}
	}

	/* ---------- CONSENT SCREEN ---------- */
	if (consent === null) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
				<div className="max-w-md w-full bg-white rounded-xl shadow p-6 space-y-4">
					<h1 className="text-xl font-semibold text-gray-800">
						Consent Required
					</h1>

					<p className="text-sm text-gray-600">
						By continuing, you agree to participate in this survey and allow
						your responses to be used for research purposes.
					</p>

					<div className="flex gap-3">
						<button
							onClick={() => handleConsent(true)}
							className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
						>
							I Agree
						</button>
						<button
							onClick={() => handleConsent(false)}
							className="flex-1 border py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
						>
							Decline
						</button>
					</div>
				</div>
			</div>
		);
	}

	if (consent === false) {
		return (
			<div className="min-h-screen flex items-center justify-center text-gray-600">
				Consent not provided.
			</div>
		);
	}

	/* ---------- SURVEY UI ---------- */
	return (
		<div className="bg-gray-50 min-h-screen">
			{/* Header */}
			<header className="sticky top-0 z-20 bg-white border-b">
				<div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
					<h1 className="font-semibold text-gray-800">Survey Form</h1>

					<select
						value={language}
						onChange={(e) => setLanguage(e.target.value)}
						className="border rounded-md px-3 py-1.5 text-sm"
					>
						{supportedLanguages.map((l) => (
							<option key={l} value={l}>
								{l.charAt(0).toUpperCase() + l.slice(1)}
							</option>
						))}
					</select>
				</div>
			</header>

			<main className="max-w-3xl mx-auto p-6 space-y-8">
				{/* Respondent Info */}
				<section className="bg-white rounded-xl shadow p-6 space-y-4">
					<h2 className="font-medium text-gray-800">
						Respondent Details
					</h2>

					<input
						type="text"
						placeholder="Full Name"
						className="w-full border rounded-md px-3 py-2"
						value={userInfo.fullname}
						onChange={(e) =>
							handleUserChange("fullname", e.target.value)
						}
					/>

					<input
						type="tel"
						placeholder="Phone Number"
						className="w-full border rounded-md px-3 py-2"
						value={userInfo.phone_no}
						onChange={(e) =>
							handleUserChange("phone_no", e.target.value)
						}
					/>
				</section>

				{/* Questions */}
				<section className="space-y-6">
					{questions.map((field) => {
						if (!shouldShowField(field, answers)) return null;

						return (
							<div
								key={field.qid}
								className="bg-white rounded-xl shadow p-5 space-y-3"
							>
								<DynamicField
									field={field}
									value={answers[field.qid]}
									language={language}
									onChange={handleChange}
								/>

								<div className="flex justify-end">
									<button
										type="button"
										onClick={() => handleSpeakQuestion(field)}
										className="text-sm px-3 py-1 rounded-md border hover:bg-gray-100 transition"
									>
										🔊 Read
									</button>
								</div>
							</div>
						);
					})}
				</section>

				{/* Submit */}
				<div className="flex justify-end">
					<button
						onClick={handleSubmit}
						disabled={loading}
						className={`px-6 py-3 rounded-lg text-white font-medium transition
              ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}
            `}
					>
						{loading ? "Submitting..." : "Submit Survey"}
					</button>
				</div>
			</main>
		</div>
	);
}
