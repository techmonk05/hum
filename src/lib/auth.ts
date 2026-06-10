// src/lib/auth.ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email    = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name     = formData.get("name") as string;
  const gender   = formData.get("gender") as string;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error || !data.user) throw new Error(error?.message ?? "Signup failed");

  // Create profile row
  const { error: profileError } = await supabase.from("profiles").insert({
    id:     data.user.id,
    name,
    gender,
  });
  if (profileError) throw new Error(profileError.message);

  redirect("/home");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email    = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  redirect("/home");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
