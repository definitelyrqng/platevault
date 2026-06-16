"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

type Partner = { numericId: number; username: string; avatarUrl: string | null };
type Conversation = { partner: Partner; lastMessage: string; lastAt: string; unread: number };
type Message = { id: string; numericId: number; content: string; senderId: string; readAt: string | null; createdAt: string };

function relativeTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function Avatar({ user }: { user: { username: string; avatarUrl: string | null }; size?: string }) {
  return user.avatarUrl ? (
    <img src={user.avatarUrl} alt={user.username} className="h-9 w-9 rounded-xl object-cover shrink-0" />
  ) : (
    <div className="h-9 w-9 rounded-xl bg-zinc-800 grid place-items-center text-xs font-bold text-zinc-400 shrink-0">
      {user.username.slice(0, 2).toUpperCase()}
    </div>
  );
}

function MessagesInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const withId = searchParams.get("with");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [newRecipient, setNewRecipient] = useState("");
  const [loadingConvo, setLoadingConvo] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load inbox
  useEffect(() => {
    fetch("/api/dm")
      .then((r) => r.json())
      .then((d) => {
        if (d.conversations) setConversations(d.conversations);
      });
  }, []);

  // Load conversation when `with` param changes
  useEffect(() => {
    if (!withId) { setPartner(null); setMessages([]); return; }
    setLoadingConvo(true);
    fetch(`/api/dm?with=${withId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.partner) setPartner(d.partner);
        if (d.messages) setMessages(d.messages);
        // Refresh inbox (clear unread)
        return fetch("/api/dm").then((r) => r.json());
      })
      .then((d) => {
        if (d?.conversations) setConversations(d.conversations);
        // get our user id from session
        return fetch("/api/me").then((r) => r.ok ? r.json() : null);
      })
      .then((me) => {
        if (me?.user?.id) setMyId(me.user.id);
      })
      .catch(() => {})
      .finally(() => setLoadingConvo(false));
  }, [withId]);

  // Scroll to bottom when messages load
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !partner || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toNumericId: partner.numericId, content: text.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setText("");
      }
    } finally {
      setSending(false);
    }
  }

  async function startNew(e: React.FormEvent) {
    e.preventDefault();
    const q = newRecipient.trim().replace(/^@/, "");
    if (!q) return;
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}&limit=1`);
    const data = await res.json();
    if (data.users?.[0]) {
      router.push(`/messages?with=${data.users[0].numericId}`);
      setNewRecipient("");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-5 w-1 rounded-full bg-indigo-500" />
          <h1 className="text-2xl font-bold text-zinc-50">Messages</h1>
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          {/* Sidebar: conversation list */}
          <aside className="space-y-3">
            {/* New message */}
            <form onSubmit={startNew} className="flex gap-2">
              <input
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                placeholder="@username or name…"
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm outline-none focus:border-indigo-700/60 min-w-0"
              />
              <button
                type="submit"
                className="shrink-0 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
              >
                +
              </button>
            </form>

            {conversations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-5 text-center text-sm text-zinc-500">
                No messages yet.<br />Search for a user above to start chatting!
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 overflow-hidden divide-y divide-zinc-800">
                {conversations.map((c) => (
                  <a
                    key={c.partner.numericId}
                    href={`/messages?with=${c.partner.numericId}`}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/40 transition-colors ${
                      withId === String(c.partner.numericId) ? "bg-indigo-950/30" : ""
                    }`}
                  >
                    <Avatar user={c.partner} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-200">@{c.partner.username}</span>
                        <span className="text-xs text-zinc-600 shrink-0">{relativeTime(c.lastAt)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-xs text-zinc-500 truncate flex-1">{c.lastMessage}</p>
                        {c.unread > 0 && (
                          <span className="shrink-0 h-4 min-w-4 rounded-full bg-indigo-600 text-[10px] font-bold text-white grid place-items-center px-1">
                            {c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </aside>

          {/* Main: chat window */}
          <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/20 overflow-hidden" style={{ minHeight: "60vh" }}>
            {!withId ? (
              <div className="flex-1 grid place-items-center text-center p-8">
                <div>
                  <div className="text-4xl mb-3">💬</div>
                  <p className="text-zinc-400 text-sm">Select a conversation or search for a user to start messaging.</p>
                </div>
              </div>
            ) : loadingConvo ? (
              <div className="flex-1 grid place-items-center">
                <div className="text-zinc-600 text-sm animate-pulse">Loading…</div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                {partner && (
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800 bg-zinc-900/40">
                    <a href={`/u/${partner.numericId}`} className="flex items-center gap-2.5 group">
                      <Avatar user={partner} />
                      <span className="text-sm font-medium text-zinc-200 group-hover:text-indigo-300 transition-colors">
                        @{partner.username}
                      </span>
                    </a>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <p className="text-center text-sm text-zinc-600 py-8">No messages yet. Say hi! 👋</p>
                  )}
                  {messages.map((msg) => {
                    const isMe = myId ? msg.senderId === myId : false;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            isMe
                              ? "bg-indigo-600 text-white rounded-tr-sm"
                              : "bg-zinc-800 text-zinc-200 rounded-tl-sm"
                          }`}
                        >
                          <p className="break-words">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${isMe ? "text-indigo-200/70" : "text-zinc-500"}`}>
                            {relativeTime(msg.createdAt)}
                            {isMe && msg.readAt && " · seen"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="border-t border-zinc-800 p-3">
                  <form onSubmit={send} className="flex gap-2">
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Write a message…"
                      maxLength={2000}
                      className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-indigo-700/60 min-w-0"
                    />
                    <button
                      type="submit"
                      disabled={!text.trim() || sending}
                      className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {sending ? "…" : "Send"}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesInner />
    </Suspense>
  );
}
