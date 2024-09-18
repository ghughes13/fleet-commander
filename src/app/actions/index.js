"use server";

import { signIn } from "@/auth";

export async function handleLogin(formData) {
  const action = formData.get("action");
  await signIn(action, { redirectTo: "/gameboard" });
  console.log("should redirect");
}

export async function handleLogout() {}
