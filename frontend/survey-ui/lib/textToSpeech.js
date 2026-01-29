const languageMap = {
    english: "en-US",
    hindi: "hi-IN",
    marathi: "mr-IN",
    tamil: "ta-IN",
};

export const speak = (text, lang = "english") => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageMap[lang] || "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
};
