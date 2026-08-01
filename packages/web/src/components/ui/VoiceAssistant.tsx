'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { aiApi } from '@/lib/api/ai';

interface VoiceAssistantProps {
  userRole: string;
  language?: 'ar' | 'en';
  conversationId?: string;
  onResponse?: (text: string, audioBase64: string) => void;
  onTranscript?: (text: string) => void;
}

export default function VoiceAssistant({
  userRole,
  language = 'ar',
  conversationId,
  onResponse,
  onTranscript,
}: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>(0);

  const isRtl = language === 'ar';

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const startListening = useCallback(async () => {
    setError('');
    setTranscript('');
    setResponse('');
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      updateAudioLevel();

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setIsProcessing(true);
        cancelAnimationFrame(animationRef.current);
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            onTranscript?.(language === 'ar' ? 'جاري المعالجة...' : 'Processing...');

            const result = await aiApi.voice(base64Audio, userRole, language, conversationId);
            setTranscript(result.transcript);
            setResponse(result.response);
            onTranscript?.(result.transcript);
            if (result.audio) {
              onResponse?.(result.response, result.audio);
              playAudio(result.audio, result.mimeType);
            }
            setIsProcessing(false);
          };
          reader.readAsDataURL(audioBlob);
        } catch (err: any) {
          setError(err.message || 'Voice processing failed');
          setIsProcessing(false);
        }
      };

      recorder.start();
      setIsListening(true);
    } catch (err: any) {
      setError(err.message || 'Microphone access denied');
    }
  }, [userRole, language, conversationId, onResponse, onTranscript]);

  const updateAudioLevel = () => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    setAudioLevel(Math.min(avg / 128, 1));
    animationRef.current = requestAnimationFrame(updateAudioLevel);
  };

  const stopListening = useCallback(() => {
    setIsListening(false);
    cancelAnimationFrame(animationRef.current);
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close();
    mediaRecorderRef.current = null;
    streamRef.current = null;
    audioContextRef.current = null;
    analyserRef.current = null;
  }, []);

  const playAudio = (base64: string, mimeType: string) => {
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mimeType || 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      audio.play();
    } catch { /* ignore */ }
  };

  const toggleListening = () => {
    isListening ? stopListening() : startListening();
  };

  const circleSize = 80;
  const borderWidth = 4;

  return (
    <div style={{ textAlign: 'center', padding: '16px' }}>
      <div
        onClick={toggleListening}
        style={{
          position: 'relative', width: circleSize, height: circleSize,
          margin: '0 auto', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
        <svg width={circleSize} height={circleSize} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
          <circle cx={circleSize / 2} cy={circleSize / 2} r={(circleSize - borderWidth) / 2}
            fill="none" stroke="#e0e0e0" strokeWidth={borderWidth} />
          <circle cx={circleSize / 2} cy={circleSize / 2} r={(circleSize - borderWidth) / 2}
            fill="none" stroke={isListening ? '#e74c3c' : '#2980b9'} strokeWidth={borderWidth}
            strokeDasharray={`${audioLevel * 2 * Math.PI * (circleSize - borderWidth) / 2} ${2 * Math.PI * (circleSize - borderWidth) / 2}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.1s ease' }}
          />
        </svg>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke={isListening ? '#e74c3c' : '#2980b9'} strokeWidth="2"
          style={{ position: 'relative', zIndex: 1 }}>
          {isListening ? (
            <>
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </>
          ) : (
            <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></>
          )}
        </svg>
      </div>

      <div style={{ marginTop: '12px', fontSize: '14px', color: '#666', minHeight: '20px' }}>
        {isProcessing ? (
          <span>{language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}</span>
        ) : isListening ? (
          <span style={{ color: '#e74c3c' }}>
            {language === 'ar' ? 'تحدث الآن... اضغط للإيقاف' : 'Speak now... tap to stop'}
          </span>
        ) : (
          <span>
            {language === 'ar' ? 'اضغط للتحدث' : 'Tap to speak'}
          </span>
        )}
      </div>

      {transcript && (
        <div style={{
          marginTop: '12px', padding: '10px', background: '#f0f7ff',
          borderRadius: '8px', fontSize: '13px', color: '#333', textAlign: isRtl ? 'right' : 'left',
        }}>
          <div style={{ fontWeight: 500, fontSize: '11px', color: '#2980b9', marginBottom: '4px' }}>
            {language === 'ar' ? 'النص المقروء:' : 'Transcript:'}
          </div>
          {transcript}
        </div>
      )}

      {response && (
        <div style={{
          marginTop: '8px', padding: '10px', background: '#e8f5e9',
          borderRadius: '8px', fontSize: '13px', color: '#333', textAlign: isRtl ? 'right' : 'left',
        }}>
          <div style={{ fontWeight: 500, fontSize: '11px', color: '#27ae60', marginBottom: '4px' }}>
            {language === 'ar' ? 'الرد:' : 'Response:'}
          </div>
          {response}
        </div>
      )}

      {error && (
        <div style={{
          marginTop: '8px', padding: '8px', background: '#fdecea',
          borderRadius: '8px', fontSize: '12px', color: '#e74c3c',
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
