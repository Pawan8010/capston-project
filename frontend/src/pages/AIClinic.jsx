import React, { useEffect, useRef, useState } from "react";
import { Bot, Send } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/layout/PageHeader";
import { useLanguage } from "../context/LanguageContext";
import { voiceQuery } from "../services/api";
import { Alert, Button, Card, Input, Spinner } from "../components/ui";

const nowTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// Deliberately about breeds this model actually knows.
const STARTERS = [
  "What feed suits a Murrah buffalo?",
  "Which breed handles hot, dry climates best?",
  "What should I check if a cow looks off-colour?",
  "How long is a Kankrej lactation?",
];

const GREETING = {
  role: "bot",
  content:
    "I can help with milk yield, feed, disease risk and breed care. Ask a question, or pick one below.",
  time: nowTime(),
};

export default function AIClinic() {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const logRef = useRef(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const sendQuestion = async (question) => {
    const text = question.trim();
    if (!text || isTyping) return;

    setMessages((prev) => [...prev, { role: "user", content: text, time: nowTime() }]);
    setInput("");
    setIsTyping(true);

    try {
      const history = messages.slice(-10).map((message) => ({
        role: message.role === "bot" ? "assistant" : "user",
        content: message.content,
      }));

      const data = await voiceQuery({ text, language: language || "en", history });

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content:
            data.response ||
            "I could not find an answer for that. Try asking about breed, feed, milk or health.",
          time: nowTime(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "I cannot reach the clinic service. Check that the backend is running.",
          time: nowTime(),
          failed: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AppShell title={t("clinic")}>
      <PageHeader
        eyebrow="Advisory"
        title="AI livestock clinic"
        subtitle="Husbandry guidance grounded in the breed table. Not a substitute for a veterinarian."
      />

      <div className="stack stack--4">
        <Alert tone="info">
          For anything urgent — an animal off feed, down, or bleeding — call a vet. This assistant
          gives general breed and husbandry guidance only.
        </Alert>

        <Card>
          <div className="chat">
            <div ref={logRef} className="chat__log">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`msg ${message.role === "user" ? "msg--user" : ""}`.trim()}
                >
                  <div className="msg__bubble">
                    {message.content}
                    <div
                      className="text-xs"
                      style={{ marginTop: "var(--space-2)", opacity: 0.6 }}
                    >
                      {message.time}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="msg">
                  <div className="msg__bubble row">
                    <Spinner size="sm" label="Thinking" />
                    <span className="text-sm text-muted">Thinking…</span>
                  </div>
                </div>
              )}

              {messages.length === 1 && (
                <div className="row row--wrap" style={{ marginTop: "var(--space-2)" }}>
                  {STARTERS.map((question) => (
                    <Button
                      key={question}
                      variant="secondary"
                      size="sm"
                      onClick={() => sendQuestion(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <form
              className="chat__composer"
              onSubmit={(event) => {
                event.preventDefault();
                sendQuestion(input);
              }}
            >
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about diet, symptoms, breed care, milk yield…"
                aria-label="Ask the clinic"
              />
              <Button
                type="submit"
                variant="primary"
                icon={Send}
                disabled={!input.trim() || isTyping}
              >
                Send
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
