const languageMap = {
    english: "en-US",
    hindi: "hi-IN",
    marathi: "mr-IN",
    tamil: "ta-IN",
};

export const speak = (text, language) => {
    return new Promise((resolve) => {
        if (!window.speechSynthesis || !text) return resolve();

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        utterance.lang = languageMap[language] || "en-US";

        utterance.rate = 1;
        utterance.pitch = 1;

        utterance.onend = resolve;
        utterance.onerror = resolve;

        window.speechSynthesis.speak(utterance);
    });
};
