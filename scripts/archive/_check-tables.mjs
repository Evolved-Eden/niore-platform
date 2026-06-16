import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const sk = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/m)?.[1]?.replace(/["']/g, "").trim();
const su = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/m)?.[1]?.replace(/["']/g, "").trim();
const sb = createClient(su, sk);

const tables = ["agent_definitions", "generators", "blueprint_templates", "verticals"];
for (const t of tables) {
  const { data, error } = await sb.from(t).select("id", { count: "exact", head: true });
  if (error && error.code === "PGRST116") console.log(`${t}: ❌ NOT FOUND`);
  else if (error) console.log(`${t}: ⚠️ ${error.message}`);
  else console.log(`${t}: ✅ EXISTS`);
}
