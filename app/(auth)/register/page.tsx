"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    // create profile immediately
    await fetch("/api/auth/onSignup", {
      method: "POST",
      body: JSON.stringify({
        user_id: data.user?.id,
        email,
      }),
    });

    router.push("/onboarding");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080810] text-white">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold">Create Account</h1>

        <input
          className="w-full p-2 bg-black border border-white/10"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full p-2 bg-black border border-white/10"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleSignup}
          className="w-full p-2 bg-white text-black font-medium"
        >
          Register
        </button>
      </div>
    </div>
  );
}