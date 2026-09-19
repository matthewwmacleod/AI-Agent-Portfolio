import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";

export default function Advisor() {
  const [plants, setPlants] = useState([]);
  const [plantId, setPlantId] = useState("");
  const [question, setQuestion] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [aiConfigured, setAiConfigured] = useState(true);
  const fileInputRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    api.listPlants().then(setPlants).catch(() => {});
    api.health().then((h) => setAiConfigured(h.aiConfigured)).catch(() => {});
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleImageChange(e) {
    const file = e.target.files?.[0] || null;
    setImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  function clearImage() {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!question.trim() && !image) return;

    const userMessage = {
      role: "user",
      text: question,
      imagePreview,
      plantName: plants.find((p) => p.id === plantId)?.name,
    };
    setMessages((prev) => [...prev, userMessage]);
    setError("");
    setSending(true);

    const askQuestion = question;
    const askImage = image;
    setQuestion("");
    clearImage();

    try {
      const { answer } = await api.askAdvisor({ question: askQuestion, plantId: plantId || undefined, image: askImage });
      setMessages((prev) => [...prev, { role: "assistant", text: answer }]);
    } catch (err) {
      setError(err.message);
      setMessages((prev) => [...prev, { role: "assistant", text: `⚠️ ${err.message}`, isError: true }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>AI Advisor</h1>
          <p>Ask a gardening question, or attach a photo to identify a plant or diagnose an issue.</p>
        </div>
      </div>

      {!aiConfigured && (
        <div className="error-banner">
          The AI advisor isn't configured yet. Set <code>ANTHROPIC_API_KEY</code> in the server's environment to enable it.
        </div>
      )}

      <div className="card advisor-panel">
        <div className="advisor-messages">
          {messages.length === 0 && (
            <p className="empty-state">
              Try: "Why are my tomato leaves turning yellow?" or attach a photo and ask "What plant is this?"
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`advisor-message ${m.role}`}>
              {m.plantName && <span className="advisor-context-tag">About: {m.plantName}</span>}
              {m.imagePreview && <img src={m.imagePreview} alt="attached" className="advisor-image-preview" />}
              {m.text && <p>{m.text}</p>}
            </div>
          ))}
          {sending && <div className="advisor-message assistant"><p>Thinking…</p></div>}
          <div ref={endRef} />
        </div>

        <form className="advisor-input" onSubmit={handleSend}>
          {imagePreview && (
            <div className="advisor-attachment">
              <img src={imagePreview} alt="preview" />
              <button type="button" className="link-toggle" onClick={clearImage}>
                Remove
              </button>
            </div>
          )}
          <div className="advisor-input-row">
            <select value={plantId} onChange={(e) => setPlantId(e.target.value)}>
              <option value="">No specific plant</option>
              {plants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <label className="btn secondary advisor-upload-btn">
              📷 Photo
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} hidden />
            </label>
          </div>
          <div className="advisor-input-row">
            <textarea
              rows={2}
              placeholder="Ask a gardening question…"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button type="submit" className="btn" disabled={sending || !aiConfigured}>
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
