import React, { useEffect, useRef, useState } from "react";
import { Activity, Bot, HeartPulse, Mic, Send, ShieldCheck, User } from "lucide-react";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import { useLanguage } from "../context/LanguageContext";
import { voiceQuery } from "../services/api";

const nowTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const starterQuestions = [
  "How much milk can a Jersey cow give?",
  "What feed is best for Gir cattle?",
  "What should I check if my cow looks sick?",
  "Which breed is best for hot climate?",
];

export default function AIClinic() {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState([
    {
      role: "bot",
      content: "Hello, I am your AI livestock clinic. Ask me about milk yield, feed, disease risks, symptoms, or breed care.",
      time: nowTime(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
          content: data.response || "I could not find an answer for that. Try asking about breed, feed, milk, or health.",
          time: nowTime(),
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "I cannot reach the clinic service right now. Please check that the backend is running on port 8000.",
          time: nowTime(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (event) => {
    event.preventDefault();
    sendQuestion(input);
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="AI Clinic"
        title="Livestock Health Assistant"
        description="Ask practical questions about breed care, feed, milk yield, disease risks, and climate suitability."
        breadcrumbs={[
          { label: t("dashboard"), to: "/dashboard" },
          { label: t("clinic") },
        ]}
      />

      <section className="clinic-layout">
        <article className="clinic-chat workspace-card">
          <div className="clinic-chat-header">
            <div className="clinic-avatar">
              <Bot size={22} />
            </div>
            <div>
              <h2>{t("clinic")}</h2>
              <p><span className="realtime-dot" /> Clinic service online</p>
            </div>
          </div>

          <div className="clinic-messages">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`clinic-message ${message.role === "user" ? "is-user" : "is-bot"}`}>
                <div className="clinic-message-icon">
                  {message.role === "user" ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className="clinic-bubble">
                  <p>{message.content}</p>
                  <span>{message.time}</span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="clinic-message is-bot">
                <div className="clinic-message-icon"><Bot size={16} /></div>
                <div className="clinic-bubble">
                  <p><span className="spinner" /> AI clinic is thinking...</p>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSend} className="clinic-input-row">
            <input
              className="input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about diet, symptoms, breed care, milk yield..."
            />
            <button type="submit" className="btn btn-primary" disabled={!input.trim() || isTyping}>
              <Send size={17} /> Send
            </button>
            <button type="button" className="btn btn-ghost" disabled title="Voice input is available from the floating assistant.">
              <Mic size={17} />
            </button>
          </form>
        </article>

        <aside className="clinic-side">
          <div className="workspace-card">
            <div className="workspace-card-title">
              <ShieldCheck size={18} />
              <span>Quick questions</span>
            </div>
            <div className="clinic-question-list">
              {starterQuestions.map((question) => (
                <button key={question} type="button" onClick={() => sendQuestion(question)}>
                  {question}
                </button>
              ))}
            </div>
          </div>

          <div className="workspace-card clinic-info-card">
            <HeartPulse size={22} />
            <div>
              <strong>Emergency note</strong>
              <p>For severe symptoms, injury, breathing trouble, poisoning, or calving complications, contact a licensed veterinarian immediately.</p>
            </div>
          </div>

          <div className="workspace-card clinic-info-card">
            <Activity size={22} />
            <div>
              <strong>Connected backend</strong>
              <p>This page uses the FastAPI `/api/voice-query/` endpoint with the same auth token as upload, realtime scanner, history, and map.</p>
            </div>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
