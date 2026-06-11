import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import AvatarCanvas from './AvatarCanvas';
import InteractionModal from './InteractionModal';
import { shouldShowField } from '../../utils/ConditionEvaluator';
import { speak } from '../../utils/textToSpeech';

const INSTRUCTION_SCRIPTS = {
  mcq: "Please select an option from the screen below.",
  checkbox: "Please select one or more options from the screen below, then click submit.",
  text: "Click on the microphone button to start speaking your answer. Once you are done, click stop."
};

const SYSTEM_SCRIPTS = {
  greeting: "Hello! I am your virtual surveyor. Let's begin the survey.",
  outro: "Thank you for completing the survey. Your responses have been recorded."
};

export default function AvatarSurveyMode({ questions, answers, setAnswers, setParadata, language, surveyId, onComplete, onExit }) {
  const [script, setScript] = useState([]);
  const [scriptIndex, setScriptIndex] = useState(-1);
  const [isLoadingScript, setIsLoadingScript] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  // sequenceState is used to control InteractionModal (e.g., 'waiting' for input)
  const [sequenceState, setSequenceState] = useState('init'); 
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isTalking, setIsTalking] = useState(false);
  const [audioIntensity, setAudioIntensity] = useState(0);
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const reqAnimRef = useRef(null);
  const questionStartTimeRef = useRef(null);
  
  // Track expected script index to safely abort async loops
  const expectedScriptIndexRef = useRef(scriptIndex);
  expectedScriptIndexRef.current = scriptIndex;

  const resolveText = (text) => {
    if (!text) return "";
    return text.replace(/\{\{(.*?)\}\}/g, (match, qid) => {
      const ans = answers[qid];
      if (!ans) return match;
      
      const refQ = questions.find(q => q.qid === qid);
      if (refQ && (refQ.type === 'mcq' || refQ.type === 'checkbox')) {
        const ansArray = Array.isArray(ans) ? ans : [ans];
        const labels = ansArray.map(a => {
          const opt = refQ.options?.find(o => o.id === a);
          return opt?.label?.[language] || opt?.label?.english || a;
        });
        return labels.join(", ");
      }
      return String(ans);
    });
  };

  // Fetch Dynamic Script
  useEffect(() => {
    let isMounted = true;
    const fetchScript = async () => {
      try {
        const res = await fetch(`/speech/avatar/script/${surveyId}/${language}`);
        if (!res.ok) throw new Error("Failed to fetch script");
        const data = await res.json();
        if (isMounted) {
          setScript(data.script);
          setIsLoadingScript(false);
          setScriptIndex(0); // Start the script
        }
      } catch (err) {
        console.error("Error fetching avatar script:", err);
        // Fallback or exit if script fails completely
        if (isMounted) onExit();
      }
    };
    fetchScript();
    return () => { isMounted = false; };
  }, [surveyId, language]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.speechSynthesis.cancel();
      setAudioIntensity(0);
    };
  }, []);

  // Play an audio ID with jaw sync
  const playAudio = async (audioId, fallbackText) => {
    return new Promise(async (resolve) => {
      if (!audioId) {
        if (fallbackText) await speak(fallbackText, language);
        return resolve();
      }

      try {
        // Append v=2 to bypass old cached audio files
        const url = `/speech/audio/${surveyId}/${audioId}?v=2`;
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
          setAudioIntensity(0);
          resolve();
        };

        audio.onerror = async () => {
          console.error("Audio playback failed:", audioId);
          if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
          setAudioIntensity(0);
          if (fallbackText) await speak(fallbackText, language);
          resolve();
        };

        // Try setting up Analyser
        try {
          if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserRef.current = audioCtxRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
          }
          if (audioCtxRef.current.state === 'suspended') {
            await audioCtxRef.current.resume();
          }
          if (!sourceNodeRef.current || sourceNodeRef.current.mediaElement !== audio) {
            sourceNodeRef.current = audioCtxRef.current.createMediaElementSource(audio);
            sourceNodeRef.current.connect(analyserRef.current);
            analyserRef.current.connect(audioCtxRef.current.destination);
          }

          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          const updateIntensity = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            setAudioIntensity((sum / dataArray.length) / 255);
            reqAnimRef.current = requestAnimationFrame(updateIntensity);
          };

          audio.play().then(() => {
            updateIntensity();
          }).catch(async (e) => {
            console.error("Audio play caught:", e);
            if (fallbackText) await speak(fallbackText, language);
            resolve();
          });
        } catch (ctxErr) {
          console.error("AudioContext setup failed, playing without jaw sync", ctxErr);
          audio.play().catch(async (e) => {
            if (fallbackText) await speak(fallbackText, language);
            resolve();
          });
        }
      } catch (err) {
        console.error("Audio block failed", err);
        if (fallbackText) await speak(fallbackText, language);
        resolve();
      }
    });
  };

  // Main Script Executor
  useEffect(() => {
    let isMounted = true;

    const runScriptNode = async () => {
      if (scriptIndex < 0 || scriptIndex >= script.length) return;
      
      const node = script[scriptIndex];
      
      // If we are at a question node, we must first check skip logic
      if (node.step === 'question') {
        const targetQ = questions.find(q => q.qid === node.qid);
        if (targetQ && !shouldShowField(targetQ, answers)) {
          // Skip this question AND its instruction
          let nextIdx = scriptIndex + 1;
          if (nextIdx < script.length && script[nextIdx].step === 'instruction') {
            nextIdx++;
          }
          setScriptIndex(nextIdx);
          return;
        }
        
        const resolvedTargetQ = {
          ...targetQ,
          text: {
            ...targetQ.text,
            [language]: resolveText(targetQ.text?.[language])
          }
        };
        setCurrentQuestion(resolvedTargetQ);
      }

      setIsTalking(true);
      setSequenceState('speaking');

      if (node.step === 'greeting' || node.step === 'outro' || node.step === 'instruction') {
        await playAudio(node.audioId, node.fallbackText);
      } else if (node.step === 'question') {
        // 1. Play the main question text
        if (node.audioParts && node.audioParts.length > 0) {
            for (const part of node.audioParts) {
                if (!isMounted || expectedScriptIndexRef.current !== scriptIndex) break;
                if (part.type === 'text') {
                    await playAudio(part.audioId);
                } else if (part.type === 'variable') {
                    const ans = answers[part.refQid];
                    if (ans) {
                        const refQ = questions.find(q => q.qid === part.refQid);
                        if (refQ && (refQ.type === 'mcq' || refQ.type === 'checkbox')) {
                            const ansArray = Array.isArray(ans) ? ans : [ans];
                            for (const a of ansArray) {
                                if (!isMounted || expectedScriptIndexRef.current !== scriptIndex) break;
                                const selectedOpt = refQ.options.find(o => o.id === a || (o.label && (o.label[language] === a || o.label.english === a)));
                                if (selectedOpt && selectedOpt.audio && selectedOpt.audio[language]) {
                                    await playAudio(selectedOpt.audio[language]);
                                } else {
                                    await playAudio(null, a); // Fallback text
                                }
                            }
                        } else {
                            await playAudio(null, String(ans));
                        }
                    } else {
                        // Missing variable fallback
                        await playAudio(null, "blank");
                    }
                }
            }
        } else {
            await playAudio(node.audioId, node.fallbackText);
        }
      }

      if (!isMounted || expectedScriptIndexRef.current !== scriptIndex) return;
      setIsTalking(false);

      // Transition logic
      if (node.step === 'greeting' || node.step === 'question') {
        // Move immediately to next node (which is usually instruction or next question)
        setScriptIndex(prev => prev + 1);
      } else if (node.step === 'instruction') {
        // Wait for user input
        setSequenceState('waiting');
        questionStartTimeRef.current = Date.now();
      } else if (node.step === 'outro') {
        setCurrentQuestion(null);
        setSequenceState('finished');
        setTimeout(() => {
          if (isMounted) onComplete();
        }, 1000);
      }
    };

    if (!isLoadingScript) {
      runScriptNode();
    }

    return () => { isMounted = false; };
  }, [scriptIndex, isLoadingScript]);

  // Empty replacement, advanceToNextQuestion is handled by script logic now

  const handleAnswer = (answerData) => {
    if (!currentQuestion) return;
    
    setAnswers(prev => ({ ...prev, [currentQuestion.qid]: answerData }));
    
    if (questionStartTimeRef.current && setParadata) {
      const timeTaken = (Date.now() - questionStartTimeRef.current) / 1000;
      setParadata(prev => {
        const existing = prev[currentQuestion.qid] || { timeTaken: 0 };
        return {
          ...prev,
          [currentQuestion.qid]: {
            timeTaken: existing.timeTaken + timeTaken,
            timestamp: new Date().toISOString()
          }
        };
      });
    }

    // Move to next node after answering (usually the next question)
    setScriptIndex(prev => {
      expectedScriptIndexRef.current = prev + 1;
      return prev + 1;
    });

    // Stop any ongoing speech if they answered early
    window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioRef.current.onended) audioRef.current.onended(); // Trigger resolve
    }
    if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
    setIsTalking(false);
    setAudioIntensity(0);
  };

  const handleAudioRecorded = (audioBlob) => {
    // For text questions, we store the blob in the answers.
    // The parent component (SurveyPage) will need to handle file uploads.
    // We store it as a special object { isAudioBlob: true, blob: audioBlob }
    handleAnswer({ isAudioBlob: true, blob: audioBlob });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-text-primary mb-2">Exit Survey?</h3>
              <p className="text-text-muted">Are you sure you want to exit? Your progress may be lost.</p>
            </div>
            <div className="flex border-t border-border">
              <button 
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-4 text-text-secondary font-medium hover:bg-surface-alt transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={onExit}
                className="flex-1 py-4 text-geist-error font-medium border-l border-border hover:bg-red-50 transition-colors"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Half - Avatar */}
      <div className="relative w-full h-[50vh] flex-shrink-0">
        <button 
          onClick={() => setShowExitConfirm(true)}
          className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white flex items-center justify-center transition-colors"
        >
          <X size={20} />
        </button>
        <AvatarCanvas isTalking={isTalking} audioIntensity={audioIntensity} />
      </div>

      {/* Bottom Half - Interaction Modal */}
      <div className="w-full h-[50vh] relative bg-surface-alt">
        <InteractionModal 
          question={currentQuestion}
          language={language}
          onAnswer={handleAnswer}
          onAudioRecorded={handleAudioRecorded}
          isListening={sequenceState !== 'waiting' && sequenceState !== 'finished'}
          currentStep={script[scriptIndex]?.step}
        />
      </div>
    </div>
  );
}
