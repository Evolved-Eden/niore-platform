"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      alert("Check your email for the magic link ✨");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="p-10 border rounded-lg w-[400px]">
        <h1 className="text-2xl mb-6">Login</h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border mb-4 text-black"
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full p-2 bg-black text-white"
        >
          {loading ? "Sending..." : "Send Magic Link"}
        </button>
      </div>
    </div>
  );
}