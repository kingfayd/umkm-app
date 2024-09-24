// components/SignUpForm.tsx
"use client"; // Tambahkan direktif ini di atas file

import React, { useState } from "react";
import Input from "./ui/input";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation"; // Ganti dengan import dari next/navigation

const SignUpForm = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "An error occurred");
        return;
      }

      router.push("/.");
    } catch (error) {
      setError("An error occurred while signing up");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        error={error ? { message: error } : undefined}
      />
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error ? { message: error } : undefined}
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={error ? { message: error } : undefined}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button type="submit">Sign Up</Button>
    </form>
  );
};

export default SignUpForm;
