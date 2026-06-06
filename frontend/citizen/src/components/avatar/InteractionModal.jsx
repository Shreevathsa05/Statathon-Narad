import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Check, Loader2 } from 'lucide-react';

export default function InteractionModal({ question, language, onAnswer, onAudioRecorded, isListening }) {
  const [selectedOptions, setSelectedOptions] = useState([]);
  
  // Microphone Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Reset state when question changes
  useEffect(() => {
    setSelectedOptions([]);
    setIsRecording(false);
    setRecordingTime(0);
    audioChunksRef.current = [];
    if (timerRef.current) clearInterval(timerRef.current);
  }, [question?.qid]);

  const handleOptionClick = (optionId) => {
    if (question.type === 'mcq') {
      onAnswer(optionId);
    } else if (question.type === 'checkbox') {
      if (selectedOptions.includes(optionId)) {
        setSelectedOptions(selectedOptions.filter(id => id !== optionId));
      } else {
        setSelectedOptions([...selectedOptions, optionId]);
      }
    }
  };

  const handleCheckboxSubmit = () => {
    onAnswer(selectedOptions);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onAudioRecorded(audioBlob);
        stream.getTracks().forEach(track => track.stop()); // Clean up microphone
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      alert("Microphone access is required for voice responses.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!question || isListening) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white p-6 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] rounded-t-2xl z-10">
        <div className="flex flex-col items-center gap-4 text-text-muted">
           {isListening ? (
             <>
               <Loader2 className="w-8 h-8 animate-spin text-geist-blue" />
               <p className="font-medium animate-pulse">Avatar is speaking...</p>
             </>
           ) : (
             <p className="font-medium">Loading next question...</p>
           )}
        </div>
      </div>
    );
  }

  const title = question.text?.[language] || question.text?.english;

  return (
    <div className="w-full h-full flex flex-col bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.06)] rounded-t-3xl z-10 overflow-hidden relative border-t border-border">
      {/* Handle / Drag indicator */}
      <div className="w-full flex justify-center py-3">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col">
        <h2 className="text-xl font-semibold text-text-primary mb-6 leading-snug">
          {title}
        </h2>

        {/* Options UI */}
        {(question.type === 'mcq' || question.type === 'checkbox') && (
          <div className="flex flex-col gap-3">
            {question.options?.map((opt) => {
              const isSelected = question.type === 'checkbox' ? selectedOptions.includes(opt.id) : false;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleOptionClick(opt.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between
                    ${isSelected 
                      ? 'border-geist-blue bg-geist-blue/5 shadow-[0_0_0_1px_rgba(0,112,243,0.2)]' 
                      : 'border-border hover:border-gray-300 hover:bg-surface-alt bg-white'}
                  `}
                >
                  <span className={`text-base font-medium ${isSelected ? 'text-geist-blue' : 'text-text-primary'}`}>
                    {opt.label?.[language] || opt.label?.english}
                  </span>
                  {isSelected && <Check className="w-5 h-5 text-geist-blue" />}
                </button>
              );
            })}

            {question.type === 'checkbox' && (
              <button 
                onClick={handleCheckboxSubmit}
                disabled={selectedOptions.length === 0}
                className="mt-4 w-full h-12 rounded-xl bg-black text-white font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Selection
              </button>
            )}
          </div>
        )}

        {/* Text / Voice Recording UI */}
        {question.type === 'text' && (
          <div className="flex flex-col items-center justify-center flex-1 py-8 gap-6">
            {!isRecording ? (
              <button 
                onClick={startRecording}
                className="w-20 h-20 rounded-full bg-geist-blue text-white shadow-[0_4px_14px_0_rgba(0,118,255,0.39)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              >
                <Mic className="w-8 h-8" />
              </button>
            ) : (
              <button 
                onClick={stopRecording}
                className="w-20 h-20 rounded-full bg-geist-error text-white shadow-[0_4px_14px_0_rgba(230,0,0,0.39)] flex items-center justify-center animate-pulse hover:scale-105 active:scale-95 transition-transform relative"
              >
                {/* Ripple effect */}
                <div className="absolute inset-0 rounded-full border-4 border-geist-error animate-ping opacity-20"></div>
                <Square className="w-7 h-7 fill-current" />
              </button>
            )}

            <div className="flex flex-col items-center gap-1">
              <span className={`text-2xl font-mono font-medium ${isRecording ? 'text-geist-error' : 'text-text-primary'}`}>
                {formatTime(recordingTime)}
              </span>
              <span className="text-sm text-text-muted">
                {isRecording ? "Recording your response..." : "Tap the microphone to speak"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
