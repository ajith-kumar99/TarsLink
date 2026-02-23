"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Browser typings ────────────────────────────────────────────────────────
interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}
interface SpeechRecognitionErrorEvent {
    error: string;
    message?: string;
}
interface SpeechRecognitionInstance extends EventTarget {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((e: SpeechRecognitionEvent) => void) | null;
    onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    onstart: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
    if (typeof window === "undefined") return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

// ─── Hook ───────────────────────────────────────────────────────────────────
export function useSpeechRecognition() {
    const [isSupported, setIsSupported] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [audioLevels, setAudioLevels] = useState<number[]>(new Array(32).fill(0));

    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animFrameRef = useRef<number>(0);
    const streamRef = useRef<MediaStream | null>(null);

    // Detect support on mount
    useEffect(() => {
        setIsSupported(getSpeechRecognition() !== null);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            recognitionRef.current?.abort();
            recognitionRef.current = null;
            stopAudioAnalysis();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const stopAudioAnalysis = useCallback(() => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = 0;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => { });
            audioContextRef.current = null;
        }
        analyserRef.current = null;
        setAudioLevels(new Array(32).fill(0));
    }, []);

    const startAudioAnalysis = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 64;
            analyser.smoothingTimeConstant = 0.7;
            source.connect(analyser);
            analyserRef.current = analyser;

            const bufferLength = analyser.frequencyBinCount; // 32
            const dataArray = new Uint8Array(bufferLength);

            const tick = () => {
                analyser.getByteFrequencyData(dataArray);
                const levels = Array.from(dataArray).map((v) => v / 255);
                setAudioLevels(levels);
                animFrameRef.current = requestAnimationFrame(tick);
            };
            tick();
        } catch {
            // If getUserMedia fails, we still have speech recognition — just no waveform
        }
    }, []);

    const startListening = useCallback(() => {
        const Ctor = getSpeechRecognition();
        if (!Ctor) {
            setError("Speech recognition not supported");
            return;
        }

        // Abort any existing session
        recognitionRef.current?.abort();

        const recognition = new Ctor();
        recognition.lang = "en-US";
        recognition.interimResults = true;
        recognition.continuous = false;

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
            setTranscript("");
        };

        recognition.onresult = (e: SpeechRecognitionEvent) => {
            let text = "";
            for (let i = 0; i < e.results.length; i++) {
                text += e.results[i][0].transcript;
            }
            setTranscript(text);
        };

        recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
            if (e.error === "not-allowed" || e.error === "service-not-allowed") {
                setError("Microphone permission denied");
            } else if (e.error === "no-speech") {
                setError(null);
            } else if (e.error !== "aborted") {
                setError(`Speech error: ${e.error}`);
            }
            setIsListening(false);
            stopAudioAnalysis();
        };

        recognition.onend = () => {
            setIsListening(false);
            stopAudioAnalysis();
        };

        recognitionRef.current = recognition;

        try {
            recognition.start();
            startAudioAnalysis();
        } catch {
            setError("Failed to start speech recognition");
            setIsListening(false);
        }
    }, [startAudioAnalysis, stopAudioAnalysis]);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        stopAudioAnalysis();
    }, [stopAudioAnalysis]);

    const cancelListening = useCallback(() => {
        recognitionRef.current?.abort();
        recognitionRef.current = null;
        stopAudioAnalysis();
        setTranscript("");
        setIsListening(false);
    }, [stopAudioAnalysis]);

    const clearError = useCallback(() => setError(null), []);

    return {
        isSupported,
        isListening,
        transcript,
        error,
        audioLevels,
        startListening,
        stopListening,
        cancelListening,
        clearError,
    };
}
