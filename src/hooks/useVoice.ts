// Voice Interaction Hook — Web Speech API (no external dependencies)
import { useCallback, useEffect, useRef, useState } from 'react'

interface UseVoiceOptions {
  onTranscript?: (text: string) => void
  onSpeakStart?: () => void
  onSpeakEnd?: () => void
}

export function useVoice(options: UseVoiceOptions = {}) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const recognitionRef = useRef<any>(null)
  const synthRef       = useRef<SpeechSynthesis | null>(null)
  const isMutedRef     = useRef(false)         // sync ref for callbacks
  const speakingRef    = useRef(false)          // prevents stale closure issues
  const optionsRef     = useRef(options)
  optionsRef.current   = options               // always current without re-subscribing

  useEffect(() => {
    const hasSpeech = 'speechSynthesis' in window
    const hasRecog  = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    setIsSupported(hasSpeech || hasRecog)
    if (hasSpeech) synthRef.current = window.speechSynthesis
  }, [])

  // ── Internal helper: mark speaking stopped ──────────────────────────────
  const markSpeakingDone = useCallback(() => {
    if (!speakingRef.current) return
    speakingRef.current = false
    setIsSpeaking(false)
    optionsRef.current.onSpeakEnd?.()
  }, [])

  // ── Cancel any active speech immediately ────────────────────────────────
  const cancelSpeech = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
    }
    markSpeakingDone()
  }, [markSpeakingDone])

  // ── speak ───────────────────────────────────────────────────────────────
  const speak = useCallback((text: string, rate = 0.9, pitch = 1.05) => {
    if (!synthRef.current || isMutedRef.current) return

    // Always cancel previous speech first
    cancelSpeech()

    const utterance = new SpeechSynthesisUtterance(text)

    // Voice selection: prefer a natural English voice
    const loadVoice = () => {
      const voices   = synthRef.current!.getVoices()
      const preferred =
        voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
        voices.find(v => v.lang === 'en-US' && v.name.includes('Microsoft')) ||
        voices.find(v => v.lang === 'en-US') ||
        voices.find(v => v.lang.startsWith('en')) ||
        voices[0]
      if (preferred) utterance.voice = preferred
    }

    // Voices may not be loaded yet
    if (synthRef.current.getVoices().length > 0) {
      loadVoice()
    } else {
      synthRef.current.addEventListener('voiceschanged', loadVoice, { once: true })
    }

    utterance.rate   = rate
    utterance.pitch  = pitch
    utterance.volume = 1

    utterance.onstart = () => {
      speakingRef.current = true
      setIsSpeaking(true)
      optionsRef.current.onSpeakStart?.()
    }
    utterance.onend = () => {
      markSpeakingDone()
    }
    utterance.onerror = () => {
      markSpeakingDone()
    }

    // Chrome bug: speech synthesis sometimes stalls after a pause.
    // A short resume nudge prevents it.
    synthRef.current.speak(utterance)
    const unstallTimer = setTimeout(() => {
      if (synthRef.current?.paused) synthRef.current.resume()
    }, 200)

    // Store cleanup ref
    return () => clearTimeout(unstallTimer)
  }, [cancelSpeech, markSpeakingDone])

  // ── stopSpeaking ────────────────────────────────────────────────────────
  const stopSpeaking = useCallback(() => {
    cancelSpeech()
  }, [cancelSpeech])

  // ── startListening ──────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    // Stop any current recognition
    recognitionRef.current?.stop()

    const recog         = new SpeechRecognition()
    recog.lang          = 'en-US'
    recog.continuous    = false
    recog.interimResults = false
    recog.maxAlternatives = 1

    recog.onstart  = () => setIsListening(true)
    recog.onend    = () => setIsListening(false)
    recog.onerror  = () => setIsListening(false)
    recog.onresult = (event: any) => {
      const text = event.results[0][0].transcript
      setTranscript(text)
      optionsRef.current.onTranscript?.(text)
    }

    recognitionRef.current = recog
    recog.start()
  }, [])

  // ── stopListening ───────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  // ── toggleMute ──────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev
      isMutedRef.current = next
      if (next) {
        // Muting — stop any active speech and reset state
        cancelSpeech()
      }
      return next
    })
  }, [cancelSpeech])

  // ── Cleanup on unmount ──────────────────────────────────────────────────
  useEffect(() => () => {
    recognitionRef.current?.stop()
    synthRef.current?.cancel()
  }, [])

  return {
    isListening,
    isSpeaking,
    isSupported,
    isMuted,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    toggleMute,
  }
}
