import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Check, Loader2 } from 'lucide-react';

export default function InteractionModal({ question, language, onAnswer, onAudioRecorded, isListening, currentStep }) {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [submittedOption, setSubmittedOption] = useState(null);
  
  // Microphone Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [micIntensity, setMicIntensity] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const vadReqRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Auto-start recording when not listening and text question
  useEffect(() => {
    if (!isListening && question?.type === 'text' && !isRecording && !submittedOption) {
      const startTimer = setTimeout(() => {
        startRecording();
      }, 800); // slight delay before starting mic
      return () => clearTimeout(startTimer);
    }
  }, [isListening, question, isRecording, submittedOption]);

  // Reset state when question changes
  useEffect(() => {
    setSelectedOptions([]);
    setSubmittedOption(null);
    setIsRecording(false);
    setRecordingTime(0);
    setMicIntensity(0);
    audioChunksRef.current = [];
    if (timerRef.current) clearInterval(timerRef.current);
    if (vadReqRef.current) cancelAnimationFrame(vadReqRef.current);
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }, [question?.qid]);

  const handleOptionClick = (optionId) => {
    if (submittedOption) return;
    if (question.type === 'mcq') {
      setSubmittedOption(optionId);
      setTimeout(() => {
        onAnswer(optionId);
      }, 800);
    } else if (question.type === 'checkbox') {
      if (selectedOptions.includes(optionId)) {
        setSelectedOptions(selectedOptions.filter(id => id !== optionId));
      } else {
        setSelectedOptions([...selectedOptions, optionId]);
      }
    }
  };

  const handleCheckboxSubmit = () => {
    if (submittedOption) return;
    setSubmittedOption('checkbox_submit');
    setTimeout(() => {
      onAnswer(selectedOptions);
    }, 800);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
          channelCount: 1
        } 
      });
      mediaRecorderRef.current = new MediaRecorder(stream, { 
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });
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
        if (vadReqRef.current) cancelAnimationFrame(vadReqRef.current);
        if (audioCtxRef.current) {
          audioCtxRef.current.close().catch(() => {});
          audioCtxRef.current = null;
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Voice Activity Detection & Visualizer setup
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let silenceStart = Date.now();
        
        const checkSilence = () => {
          if (mediaRecorderRef.current?.state !== "recording") return;
          
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const average = sum / dataArray.length;
          
          setMicIntensity(average / 128); // Normalize for CSS opacity/blur

          if (average > 15) { // Speaking threshold increased to avoid background noise
            silenceStart = Date.now();
          } else {
            if (Date.now() - silenceStart > 2500) {
              // 2.5 seconds of silence
              stopRecording();
              return;
            }
          }
          
          vadReqRef.current = requestAnimationFrame(checkSilence);
        };
        
        checkSilence();
      } catch (e) {
        console.error("VAD Setup Failed", e);
      }
      
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      alert("Microphone access is required for voice responses.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setSubmittedOption('audio_submit');
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!question) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white p-6 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] rounded-t-2xl z-10">
        <div className="flex flex-col items-center gap-4 text-text-muted">
           <Loader2 className="w-8 h-8 animate-spin text-geist-blue" />
           <p className="font-medium animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  // Ensure question content renders even without delay logic

  const title = question.text?.[language] || question.text?.english;

  return (
    <div className="w-full h-full flex flex-col bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.06)] rounded-t-3xl z-10 overflow-hidden relative border-t border-border">
      {/* Handle / Drag indicator */}
      <div className="w-full flex justify-center py-3">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col relative">
        {/* Overlay when user submits an option or audio */}
        {submittedOption && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-xl">
             <Loader2 className="w-8 h-8 animate-spin text-geist-blue mb-4" />
             <p className="font-medium text-text-primary animate-pulse">Processing response...</p>
          </div>
        )}

        {/* Solid White Overlay when Avatar is speaking the initial question/greeting */}
        {isListening && !submittedOption && (currentStep === 'question' || currentStep === 'greeting' || currentStep === 'outro') && (
          <div className="absolute inset-0 bg-white z-20 flex flex-col items-center justify-center rounded-xl">
             <Loader2 className="w-8 h-8 animate-spin text-geist-blue mb-4" />
             <p className="font-medium text-text-primary animate-pulse">Avatar is speaking...</p>
          </div>
        )}

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
                  disabled={!!submittedOption}
                  onClick={() => handleOptionClick(opt.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between disabled:opacity-80
                    ${isSelected || submittedOption === opt.id
                      ? 'border-geist-blue bg-geist-blue/5 shadow-[0_0_0_1px_rgba(0,112,243,0.2)]' 
                      : 'border-border hover:border-gray-300 hover:bg-surface-alt bg-white'}
                  `}
                >
                  <span className={`text-base font-medium ${isSelected || submittedOption === opt.id ? 'text-geist-blue' : 'text-text-primary'}`}>
                    {opt.label?.[language] || opt.label?.english}
                  </span>
                  {(isSelected || submittedOption === opt.id) && <Check className="w-5 h-5 text-geist-blue" />}
                </button>
              );
            })}

            {question.type === 'checkbox' && (
              <button 
                onClick={handleCheckboxSubmit}
                disabled={selectedOptions.length === 0 || !!submittedOption}
                className="mt-4 w-full h-12 rounded-xl bg-black text-white font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Selection
              </button>
            )}
          </div>
        )}

        {/* Text / Voice Recording UI */}
        {question.type === 'text' && (
          <div className="flex flex-col items-center justify-center flex-1 py-8 gap-10 relative">
            
            {/* Dynamic Gradient Expanding Orb */}
            <button 
              onClick={isRecording ? stopRecording : undefined}
              disabled={!!submittedOption || isListening}
              className="relative flex items-center justify-center w-40 h-40 group cursor-pointer disabled:cursor-not-allowed"
            >
              {isRecording ? (
                <>
                  <div 
                    className="rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 transition-all duration-75 absolute group-hover:scale-95"
                    style={{
                      width: `${100 + micIntensity * 120}px`,
                      height: `${100 + micIntensity * 120}px`,
                      boxShadow: `0 0 ${20 + micIntensity * 60}px rgba(168, 85, 247, 0.7)`
                    }}
                  />
                  <Square className="w-8 h-8 text-white absolute z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              ) : (
                <div className="rounded-full bg-surface-alt border-4 border-dashed border-border w-24 h-24 flex items-center justify-center transition-all duration-500" />
              )}
            </button>

            <div className="flex flex-col items-center gap-2 z-10">
              {isRecording ? (
                <>
                  <span className="text-3xl font-mono font-bold text-geist-blue drop-shadow-sm">
                    {formatTime(recordingTime)}
                  </span>
                  <span className="text-base font-semibold text-text-primary animate-pulse">
                    Listening to your response...
                  </span>
                  <button 
                    onClick={stopRecording}
                    className="mt-2 text-sm text-text-muted hover:text-geist-error underline underline-offset-2 transition-colors"
                  >
                    Stop manually
                  </button>
                </>
              ) : (
                <span className="text-base font-medium text-text-muted">
                  {isListening ? "Waiting for avatar..." : "Preparing microphone..."}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
