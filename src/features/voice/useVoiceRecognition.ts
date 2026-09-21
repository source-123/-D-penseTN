import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

// ─── Web Speech API (Chrome/Safari) ───
type WebSpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};

export function isVoiceSupported(): boolean {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return false;
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }
  // Sur natif, on suppose que expo-speech-recognition est installé
  return true;
}

export function useVoiceRecognition() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const webRecRef = useRef<WebSpeechRec | null>(null);

  // ─── Cleanup ───
  useEffect(() => {
    return () => {
      if (Platform.OS === 'web') {
        webRecRef.current?.stop();
      } else {
        try {
          const SpeechRec = require('expo-speech-recognition');
          SpeechRec.ExpoSpeechRecognitionModule.stop();
        } catch {}
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (Platform.OS === 'web') {
      webRecRef.current?.stop();
    } else {
      try {
        const SpeechRec = require('expo-speech-recognition');
        SpeechRec.ExpoSpeechRecognitionModule.stop();
      } catch (e) {
        console.warn('[voice] stop failed', e);
      }
    }
    setListening(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setTranscript('');

    // ─── WEB ───
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') {
        setError('Non supporté');
        return;
      }
      const w = window as any;
      const SpeechRec = w.SpeechRecognition || w.webkitSpeechRecognition;
      if (!SpeechRec) {
        setError('Reconnaissance vocale non supportée sur ce navigateur');
        return;
      }

      const rec: WebSpeechRec = new SpeechRec();
      rec.lang = 'fr-FR';
      rec.continuous = false;
      rec.interimResults = true;

      rec.onresult = (e: any) => {
        let finalText = '';
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText += t;
          else interim += t;
        }
        setTranscript((prev) => prev + finalText + interim);
      };

      rec.onerror = (e: any) => {
        setError(e.error ?? 'Erreur de reconnaissance');
        setListening(false);
      };

      rec.onend = () => setListening(false);

      webRecRef.current = rec;
      rec.start();
      setListening(true);
      return;
    }

    // ─── NATIF (Android/iOS) ───
    try {
      const SpeechRec = require('expo-speech-recognition');
      const { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } = SpeechRec;

      // Demander la permission
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        setError('Permission micro refusée');
        return;
      }

      // Démarrer
      ExpoSpeechRecognitionModule.start({
        lang: 'fr-FR',
        interimResults: true,
        continuous: false,
        requiresOnDeviceRecognition: false,
        addsPunctuation: false,
      });

      setListening(true);
    } catch (e: any) {
      console.warn('[voice] native start failed', e);
      setError(e?.message ?? 'Reconnaissance vocale indisponible');
      setListening(false);
    }
  }, []);

  // ─── NATIF : écouter les événements ───
  if (Platform.OS !== 'web') {
    try {
      const SpeechRec = require('expo-speech-recognition');
      const { useSpeechRecognitionEvent } = SpeechRec;

      // eslint-disable-next-line react-hooks/rules-of-hooks
      useSpeechRecognitionEvent('result', (event: any) => {
        const t = event.results?.[0]?.transcript ?? '';
        if (t) setTranscript((prev) => prev + t);
      });

      // eslint-disable-next-line react-hooks/rules-of-hooks
      useSpeechRecognitionEvent('error', (event: any) => {
        setError(event.message ?? event.error ?? 'Erreur');
        setListening(false);
      });

      // eslint-disable-next-line react-hooks/rules-of-hooks
      useSpeechRecognitionEvent('end', () => {
        setListening(false);
      });
    } catch (e) {
      console.warn('[voice] hooks setup failed', e);
    }
  }

  return { listening, transcript, error, start, stop, supported: isVoiceSupported() };
}
