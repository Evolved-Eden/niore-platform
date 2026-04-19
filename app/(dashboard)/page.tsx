"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/login");
        return;
      }

      setUser(data.user);
    };

    load();
  }, []);

  if (!user) return <div className="p-10">Loading system...</div>;

  return (
    <div className="p-10">
      <h1 className="text-3xl">Welcome to Hoodacity 🧠</h1>

      <p className="mt-4">
        User: {user.email}
      </p>

      <div className="mt-6">
        <button
          onClick={() => router.push("/chat")}
          className="p-2 bg-black text-white"
        >
          Open Intelligence Chat
        </button>
      </div>
    </div>
  );
}