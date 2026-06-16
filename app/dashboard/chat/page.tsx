"use client";

import { useState } from "react";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  const sendMessage = async () => {
    const res = await fetch("/api/zuri", {
      method: "POST",
      body: JSON.stringify({ message: input }),
    });

    const data = await res.json();

    setMessages((prev) => [...prev, "You: " + input, "Zuri: " + data.response]);
    setInput("");
  };

  return (
    <div className="p-6 w-full">
      <div className="space-y-3 mb-6">
        {messages.map((m, i) => (
          <div key={i}>{m}</div>
        ))}
      </div>

      <input
        className="border p-2 text-black w-full"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button onClick={sendMessage} className="mt-2 px-4 py-2 bg-white text-black">
        Send
      </button>
    </div>
  );
}