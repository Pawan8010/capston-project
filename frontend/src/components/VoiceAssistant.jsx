import React, { useState, useRef, useCallback, useEffect } from "react";
import { voiceQuery } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import { Mic, MicOff, Volume2, X, Info } from "lucide-react";

const LANG_CODES = { en: "en-US", hi: "hi-IN", mr: "mr-IN" };

export default function VoiceAssistant({ breedContext = null }) {
  const { language, t } = useLanguage();

  const [open,       setOpen]       = useState(false);
  const [listening,  setListening]  = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response,   setResponse]   = useState("");
  const [loading,    setLoading]    = useState(false);
  const [speaking,   setSpeaking]   = useState(false);
  const [error,      setError]      = useState("");
  const [history,    setHistory]    = useState([]);

  const recognitionRef = useRef(null);
  const synthRef       = useRef(window.speechSynthesis);

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  /* ── Text-to-speech ──────────────────────────────────────────────────── */
  const speak = useCallback((text) => {
    if (!text) return;
    const synth = synthRef.current;
    if (!synth) {
      console.warn("Speech Synthesis not supported");
      return;
    }
    
    synth.cancel();
    const utt  = new SpeechSynthesisUtterance(text);
    utt.lang   = LANG_CODES[language] || "en-US";
    utt.rate   = 0.95;
    utt.pitch  = 1.0;
    
    utt.onstart = () => setSpeaking(true);
    utt.onend   = () => setSpeaking(false);
    utt.onerror = (e) => {
      console.error("TTS Error:", e);
      setSpeaking(false);
    };
    
    synth.speak(utt);
  }, [language]);

  const stopSpeaking = () => { synthRef.current.cancel(); setSpeaking(false); };

  /* ── Submit transcript to backend ────────────────────────────────────── */
  const sendQuery = useCallback(async (text) => {
    if (!text.trim()) return;
    setLoading(true); setError("");
    try {
      const payload = {
        text,
        language,
        breed: breedContext?.primary_breed || null,
        confidence: breedContext?.confidence || null,
      };
      const data = await voiceQuery(payload);
      setResponse(data.response);
      setHistory((h) => [{ q: text, a: data.response }, ...h.slice(0, 4)]);
      
      // Attempt to speak (may be blocked by browser if no recent user click)
      speak(data.response);
    } catch (err) {
      console.error("Voice Query Error:", err);
      setError("Cannot reach AI server. Please ensure the backend is running on port 8000.");
    } finally {
      setLoading(false);
    }
  }, [language, breedContext, speak]);

  /* ── Speech recognition setup ────────────────────────────────────────── */
  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      setError("Speech recognition is only supported in Chrome/Edge.");
      return;
    }

    // Stop existing if any
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }

    setError(""); setTranscript(""); setResponse("");
    const rec = new SpeechRecognition();
    rec.lang = LANG_CODES[language] || "en-US";
    rec.interimResults = true;
    rec.continuous = false; // Stop after one phrase

    rec.onstart  = () => setListening(true);
    rec.onerror  = (event) => { 
      setListening(false); 
      if (event.error === 'not-allowed') {
        setError("Microphone permission denied.");
      } else {
        setError("Could not hear you clearly. Try again.");
      }
    };
    rec.onend    = () => {
      setListening(false);
    };

    rec.onresult = (e) => {
      const result = e.results[e.results.length - 1];
      const text = result[0].transcript;
      setTranscript(text);
      if (result.isFinal) {
        sendQuery(text);
      }
    };

    recognitionRef.current = rec;
    rec.start();
  }, [language, SpeechRecognition, sendQuery]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <>
      <button
        id="voice-assistant-btn"
        className={`voice-fab ${listening ? "voice-fab-active" : ""} ${open ? "voice-fab-open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        title="Voice Assistant"
      >
        {open ? <X size={22} /> : <Mic size={22} />}
        {listening && <span className="voice-pulse-ring" />}
      </button>

      {open && (
        <div className="voice-panel card">
          <div className="voice-panel-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div className="voice-panel-icon">🤖</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{t("voice_assistant")}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--slate-500)" }}>
                  Ask about health, diet, or milk...
                </div>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
              <X size={14} />
            </button>
          </div>

          {breedContext?.primary_breed && (
            <div className="voice-context-badge">
              🔬 Context: <strong>{breedContext.primary_breed.replace("_", " ")}</strong>
            </div>
          )}

          <div className="voice-transcript">
            {listening ? (
              <div className="voice-waves">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="voice-wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
                <span style={{ marginLeft: "0.75rem", fontSize: "0.8rem", color: "var(--slate-400)" }}>
                  Listening...
                </span>
              </div>
            ) : transcript ? (
              <div className="voice-you">
                <span className="voice-label">You:</span> {transcript}
              </div>
            ) : (
              <div style={{ color: "var(--slate-600)", fontSize: "0.82rem", textAlign: "center" }}>
                Press the mic to ask a question
              </div>
            )}
          </div>

          {(loading || response) && (
            <div className={`voice-response ${speaking ? "speaking-active" : ""}`}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="spinner" style={{ width: 14, height: 14 }} />
                  <span style={{ fontSize: "0.82rem", color: "var(--slate-400)" }}>Thinking...</span>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div><span className="voice-label">AI:</span> {response}</div>
                    <button 
                      className={`btn btn-ghost btn-sm ${speaking ? "btn-danger" : ""}`} 
                      onClick={speaking ? stopSpeaking : () => speak(response)}
                      style={{ padding: "0.25rem", borderRadius: "50%", minWidth: "28px", height: "28px" }}
                    >
                      {speaking ? <Volume2 size={14} className="anim-pulse" /> : <Volume2 size={14} />}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {error && (
            <div className="alert alert-error" style={{ margin: "0.75rem", fontSize: "0.78rem", display: "flex", gap: "0.5rem" }}>
              <Info size={14} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div className="voice-controls">
            {!listening ? (
              <button className="btn btn-primary w-full" onClick={startListening} disabled={loading}>
                <Mic size={16} /> {t("speak_now")}
              </button>
            ) : (
              <button className="btn btn-danger w-full" onClick={stopListening}>
                <MicOff size={16} /> Stop
              </button>
            )}
          </div>

          <div className="voice-suggestions">
            {["Which breed is this?", "Milk yield?", "Care advice"].map((q) => (
              <button key={q} className="voice-chip" onClick={() => { setTranscript(q); sendQuery(q); }}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

