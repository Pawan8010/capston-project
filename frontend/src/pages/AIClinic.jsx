import React, { useState, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Mic, Send, Bot, User, HeartPulse, ShieldCheck, Stethoscope, MessageSquare } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

export default function AIClinic() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([
    { role: "bot", content: "Hello! I am your AI Veterinary Assistant. How can I help your livestock today?", time: new RegExp().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input, time: new RegExp().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("http://localhost:8000/api/voice/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await currentUser.getIdToken()}`
        },
        body: JSON.stringify({ text: input, language: "en" })
      });
      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: "bot", 
        content: data.response, 
        time: new RegExp().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "bot", content: "Sorry, I'm having trouble connecting right now.", time: "" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="home-page">
      <Navbar />
      
      <main className="main-content" style={{ marginLeft: 0, paddingTop: "8rem" }}>
        <div className="container" style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 1.5rem" }}>
          
          <div className="grid-2 gap-8 mb-12">
            {/* Chat Section */}
            <div className="card card-glass flex flex-direction-column" style={{ height: "600px", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div className="sidebar-brand" style={{ background: "var(--bg-700)", padding: "1rem 1.5rem" }}>
                <div className="sidebar-logo" style={{ width: "40px", height: "40px" }}>🩺</div>
                <div className="sidebar-brand-text">
                  <h1 style={{ fontSize: "1.1rem" }}>{t("clinic")}</h1>
                  <p className="text-xs" style={{ color: "var(--green-400)" }}>● AI Doctor Online</p>
                </div>
              </div>

              <div className="flex-1" style={{ overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", flex: 1 }}>
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-3 max-w-xs ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className="sidebar-logo" style={{ width: "32px", height: "32px", fontSize: "0.8rem", flexShrink: 0 }}>
                        {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                      </div>
                      <div style={{ 
                        background: m.role === 'user' ? 'var(--green-600)' : 'var(--bg-700)',
                        padding: "0.75rem 1rem",
                        borderRadius: m.role === 'user' ? "1rem 0.2rem 1rem 1rem" : "0.2rem 1rem 1rem 1rem",
                        fontSize: "0.9rem",
                        boxShadow: "var(--shadow-sm)"
                      }}>
                        {m.content}
                        <div className="text-xs mt-1 opacity-50" style={{ textAlign: "right" }}>{m.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 items-center text-muted text-xs">
                      <div className="spinner" style={{ width: "14px", height: "14px", borderWidth: "2px" }} />
                      AI Vet is typing...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSend} className="sidebar-bottom" style={{ padding: "1rem", background: "var(--bg-800)" }}>
                <div className="input-icon-wrap flex gap-2">
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Ask about diet, health, or symptoms..." 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: "0 1.25rem" }}>
                    <Send size={18} />
                  </button>
                  <button type="button" className="btn btn-ghost" style={{ padding: "0 1rem" }}>
                    <Mic size={18} />
                  </button>
                </div>
              </form>
            </div>

            {/* Info Section */}
            <div className="flex flex-column gap-6">
              <div className="card card-green">
                <h3 className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={20} color="var(--green-400)" /> Smart Diagnosis
                </h3>
                <p className="text-sm text-muted mb-4">
                  Our AI uses data from 500+ veterinary protocols to provide instant first-aid advice for cattle.
                </p>
                <div className="grid-2 gap-3">
                  <div className="chip text-center">Dietary Tips</div>
                  <div className="chip text-center">Disease Risks</div>
                  <div className="chip text-center">Care Routine</div>
                  <div className="chip text-center">Vaccinations</div>
                </div>
              </div>

              <div className="card">
                <h3 className="flex items-center gap-2 mb-3">
                  <HeartPulse size={20} color="var(--red-400)" /> Emergency Contacts
                </h3>
                <p className="text-sm text-muted mb-4">Quick access to local government veterinary services.</p>
                <button className="btn btn-outline w-full justify-start mb-2">📞 Call Local Vet Office</button>
                <button className="btn btn-ghost w-full justify-start">📍 Find Nearest Clinic</button>
              </div>

              <div className="card card-blue">
                <h3 className="flex items-center gap-2 mb-3">
                  <MessageSquare size={20} color="var(--blue-400)" /> Multilingual Support
                </h3>
                <p className="text-sm text-muted">Ask questions in English, Hindi, or Marathi for contextual answers.</p>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
