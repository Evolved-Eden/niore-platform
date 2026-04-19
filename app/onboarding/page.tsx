"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Onboarding() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const setup = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) return;

      // create org if missing
      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("owner_id", userData.user.id)
        .maybeSingle();

      if (!org) {
        const { data: newOrg } = await supabase
          .from("organizations")
          .insert({
            name: "My Intelligence",
            owner_id: userData.user.id,
          })
          .select()
          .single();

        await supabase.from("agents").insert({
          org_id: newOrg.id,
          name: "Zuri",
          role: "orchestrator",
        });
      }

      router.push("/dashboard");
    };

    setup();
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-2xl">Initializing your intelligence system...</h1>
      <p className="mt-2">Building your control center 🧠</p>
    </div>
  );
}