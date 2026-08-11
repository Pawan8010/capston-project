import React, { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Send, Volume2, VolumeX, X } from "lucide-react";
import { voiceQuery } from "../services/api";
import { formatBreed } from "../utils/helpers";
import { useLanguage } from "../context/LanguageContext";
import { Alert, Badge, Button, Input, Spinner } from "./ui";

const LANG_CODES = { en: "en-US", hi: "hi-IN", mr: "mr-IN" };

/**
 * Floating livestock assistant.
 *
 * Speech is progressive enhancement: recognition and synthesis are used
 * when the browser provides them, and the typed composer is always
 * present so the assistant works without either.
 */
export default function VoiceAssistant({ breedContext = null }) {
  const { language, t } = useLanguage();

  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);

  const recognitionRef = useRef(null);
  const logRef = useRef(null);

  const SpeechRecognition =
    typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const speak = useCallback(
    (text) => {
      const synth = window.speechSynthesis;
      if (!text || !synth) return;

      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANG_CODES[language] || "en-US";
      utterance.rate = 0.95;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      synth.speak(utterance);
    },
    [language]
  );

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  const sendQuery = useCallback(
    async (text) => {
      const question = text.trim();
      if (!question) return;

      setMessages((prev) => [...prev, { role: "user", content: question }]);
      setDraft("");
      setLoading(true);
      setError("");

      try {
        const data = await voiceQuery({
          text: question,
          language,
          breed: breedContext?.primary_breed || null,
          confidence: breedContext?.confidence || null,
          history: messages.slice(-10).map(({ role, content }) => ({ role, content })),
        });

        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
        speak(data.response);
      } catch {
        setError("Cannot reach the assistant. Check that the backend is running.");
      } finally {
        setLoading(false);
      }
    },
    [language, breedContext, messages, speak]
  );

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      setError("Speech recognition needs Chrome or Edge. You can still type.");
      return;
    }

    try {
      recognitionRef.current?.stop();
    } catch {
      /* no active session */
    }

    setError("");
    const recognition = new SpeechRecognition();
    recognition.lang = LANG_CODES[language] || "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = (event) => {
      setListening(false);
      setError(
        event.error === "not-allowed"
          ? "Microphone permission was denied."
          : "Could not hear that clearly. Try again."
      );
    };
    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      setDraft(result[0].transcript);
      if (result.isFinal) sendQuery(result[0].transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language, SpeechRecognition, sendQuery]);

  // Keep the newest message in view as the conversation grows.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(
    () => () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* nothing to stop */
      }
      window.speechSynthesis?.cancel();
    },
    []
  );

  return (
    <>
      <button
        className={`voice-fab ${listening ? "voice-fab--recording" : ""}`.trim()}
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close assistant" : "Open livestock assistant"}
        aria-expanded={open}
      >
        {open ? <X size={20} aria-hidden="true" /> : <Mic size={20} aria-hidden="true" />}
      </button>

      {open && (
        <div className="voice-panel" role="dialog" aria-label={t("voice_assistant") || "Assistant"}>
          <div className="card__header">
            <div style={{ minWidth: 0 }}>
              <h3 className="card__title">{t("voice_assistant") || "Assistant"}</h3>
              <p className="card__subtitle">Ask about feed, symptoms or milk yield</p>
            </div>
            <div className="row">
              {speaking && (
                <Button variant="ghost" size="sm" iconOnly icon={VolumeX} onClick={stopSpeaking} aria-label="Stop speaking" />
              )}
              <Button variant="ghost" size="sm" iconOnly icon={X} onClick={() => setOpen(false)} aria-label="Close" />
            </div>
          </div>

          {breedContext?.primary_breed && (
            <div style={{ padding: "var(--space-3) var(--space-4) 0" }}>
              <Badge tone="brand">Context: {formatBreed(breedContext.primary_breed)}</Badge>
            </div>
          )}

          <div ref={logRef} className="chat__log" style={{ maxHeight: "18rem" }}>
            {messages.length === 0 && !loading && (
              <p className="text-sm text-muted">
                Try “what should I feed a Murrah buffalo?” or “signs of mastitis”.
              </p>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`msg ${message.role === "user" ? "msg--user" : ""}`.trim()}>
                <div className="msg__bubble">{message.content}</div>
              </div>
            ))}

            {loading && (
              <div className="msg">
                <div className="msg__bubble">
                  <Spinner size="sm" label="Thinking" />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div style={{ padding: "0 var(--space-4) var(--space-3)" }}>
              <Alert tone="warning">{error}</Alert>
            </div>
          )}

          <form
            className="chat__composer"
            onSubmit={(event) => {
              event.preventDefault();
              sendQuery(draft);
            }}
          >
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask a question…"
              aria-label="Ask the assistant"
            />
            <Button
              variant={listening ? "subtle" : "secondary"}
              iconOnly
              icon={listening ? Volume2 : Mic}
              onClick={startListening}
              aria-label="Speak your question"
              aria-pressed={listening}
            />
            <Button type="submit" variant="primary" iconOnly icon={Send} disabled={!draft.trim() || loading} aria-label="Send" />
          </form>
        </div>
      )}
    </>
  );
}
