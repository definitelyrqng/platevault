"use client";

import { useState } from "react";

export default function ContactPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("sent");
        setEmail("");
        setMessage("");
      } else {
        setErrorMsg(data.error ?? "Something went wrong.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error — please try again.");
      setStatus("error");
    }
  }

  return (
    <main className="mx-auto max-w-xl px-6 pb-20 pt-14">

      <div className="mb-8 flex items-start gap-3">
        <div className="mt-1.5 h-5 w-1 rounded-full bg-indigo-500 shrink-0" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-1">Get in touch</p>
          <h1 className="text-3xl font-bold text-zinc-50">Contact</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Got a question, spotted an issue, or just want to say hi? Send a message and we&apos;ll reply to your email.
          </p>
        </div>
      </div>

      {status === "sent" ? (
        <div className="rounded-2xl border border-emerald-800 bg-emerald-950/30 px-6 py-8 text-center">
          <div className="text-3xl mb-3">✉️</div>
          <div className="text-lg font-semibold text-emerald-300 mb-1">Message sent!</div>
          <p className="text-sm text-zinc-400">We&apos;ll get back to you at your email address as soon as possible.</p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-5 text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2"
          >
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Your email <span className="text-zinc-600">(we&apos;ll reply here)</span>
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-indigo-700/60 focus:ring-1 focus:ring-indigo-700/20 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Message
            </label>
            <textarea
              id="message"
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors resize-none"
            />
            <div className="mt-1 text-right text-xs text-zinc-600">{message.length}/2000</div>
          </div>

          {status === "error" && (
            <p className="text-sm text-red-400">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-950/50 disabled:opacity-40 transition-colors"
          >
            {status === "loading" ? "Sending…" : "Send message"}
          </button>

        </form>
      )}

    </main>
  );
}
