// CTRL + ALT News — CommentsSection Component
// Design: Cyberpunk Brutalism — dark glassmorphism cards, neon category accents
// Features: mock seed comments, nested replies (1 level), upvotes, new comment form, bilingual PT/EN
// A11y: aria-labels, roles, focus-visible, live region for new comments

import { useState, useId, useRef } from "react";
import { ThumbsUp, MessageSquare, Send, ChevronDown, ChevronUp, User } from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Reply {
  id: number;
  author: string;
  initials: string;
  avatarColor: string;
  time: string;
  body: { en: string; pt: string };
  upvotes: number;
  upvotedByUser: boolean;
}

interface Comment {
  id: number;
  author: string;
  initials: string;
  avatarColor: string;
  time: string;
  body: { en: string; pt: string };
  upvotes: number;
  upvotedByUser: boolean;
  replies: Reply[];
  showReplies: boolean;
  replyOpen: boolean;
}

// ─── No seed comments — all articles start with zero comments ─────────────────

// ─── Avatar component ─────────────────────────────────────────────────────────

function Avatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `${color}22`,
        border: `2px solid ${color}66`,
        color: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: size * 0.33,
        flexShrink: 0,
        fontFamily: "var(--font-display)",
        letterSpacing: "0.05em",
      }}
    >
      {initials}
    </div>
  );
}

// ─── Reply component ──────────────────────────────────────────────────────────

function ReplyCard({
  reply,
  lang,
  catColor,
  onUpvote,
}: {
  reply: Reply;
  lang: "en" | "pt";
  catColor: string;
  onUpvote: (id: number) => void;
}) {
  return (
    <div
      role="article"
      aria-label={`Reply by ${reply.author}`}
      style={{
        display: "flex",
        gap: "12px",
        padding: "14px 16px",
        borderRadius: "6px",
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
        marginTop: "10px",
      }}
    >
      <Avatar initials={reply.initials} color={reply.avatarColor} size={30} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <span style={{ color: "rgba(255,255,255,0.9)", fontWeight: 700, fontSize: "0.82rem" }}>
            {reply.author}
          </span>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem" }}>{reply.time}</span>
        </div>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.84rem", lineHeight: 1.6, margin: 0 }}>
          {reply.body[lang]}
        </p>
        <button
          type="button"
          onClick={() => onUpvote(reply.id)}
          aria-label={`${reply.upvotedByUser ? "Remove upvote from" : "Upvote"} reply by ${reply.author} — ${reply.upvotes} upvotes`}
          aria-pressed={reply.upvotedByUser}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            marginTop: "8px",
            padding: "4px 10px",
            borderRadius: "4px",
            border: `1px solid ${reply.upvotedByUser ? catColor + "66" : "rgba(255,255,255,0.1)"}`,
            background: reply.upvotedByUser ? `${catColor}18` : "transparent",
            color: reply.upvotedByUser ? catColor : "rgba(255,255,255,0.4)",
            fontSize: "0.75rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <ThumbsUp size={11} />
          {reply.upvotes}
        </button>
      </div>
    </div>
  );
}

// ─── Main CommentsSection ─────────────────────────────────────────────────────

interface CommentsSectionProps {
  articleId: number;
  lang: "en" | "pt";
  catColor: string;
  catBg: string;
  catBorder: string;
}

export default function CommentsSection({ articleId, lang, catColor, catBg, catBorder }: CommentsSectionProps) {
  const formId = useId();
  const liveRef = useRef<HTMLDivElement>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newName, setNewName] = useState("");
  const [newBody, setNewBody] = useState("");
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
  const [replyNames, setReplyNames] = useState<Record<number, string>>({});
  const [sortBy, setSortBy] = useState<"top" | "new">("top");

  const t = {
    title: { en: "Comments", pt: "Comentários" },
    sortTop: { en: "Top", pt: "Mais votados" },
    sortNew: { en: "Newest", pt: "Mais recentes" },
    namePlaceholder: { en: "Your name", pt: "Seu nome" },
    commentPlaceholder: { en: "Share your thoughts on this article…", pt: "Compartilhe sua opinião sobre este artigo…" },
    submit: { en: "Post Comment", pt: "Publicar Comentário" },
    reply: { en: "Reply", pt: "Responder" },
    replies: { en: "replies", pt: "respostas" },
    hideReplies: { en: "Hide replies", pt: "Ocultar respostas" },
    showReplies: { en: "Show replies", pt: "Mostrar respostas" },
    replyPlaceholder: { en: "Write a reply…", pt: "Escreva uma resposta…" },
    postReply: { en: "Post Reply", pt: "Publicar Resposta" },
    cancel: { en: "Cancel", pt: "Cancelar" },
    beFirst: { en: "Be the first to comment!", pt: "Seja o primeiro a comentar!" },
    nameRequired: { en: "Please enter your name.", pt: "Por favor, insira seu nome." },
    bodyRequired: { en: "Please write something before posting.", pt: "Por favor, escreva algo antes de publicar." },
    posted: { en: "Comment posted!", pt: "Comentário publicado!" },
    replyPosted: { en: "Reply posted!", pt: "Resposta publicada!" },
  };

  const totalComments = comments.reduce((acc, c) => acc + 1 + c.replies.length, 0);

  const sorted = [...comments].sort((a, b) =>
    sortBy === "top" ? b.upvotes - a.upvotes : b.id - a.id
  );

  // ── Upvote comment ──
  function upvoteComment(id: number) {
    setComments((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, upvotes: c.upvotedByUser ? c.upvotes - 1 : c.upvotes + 1, upvotedByUser: !c.upvotedByUser }
          : c
      )
    );
  }

  // ── Upvote reply ──
  function upvoteReply(commentId: number, replyId: number) {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              replies: c.replies.map((r) =>
                r.id === replyId
                  ? { ...r, upvotes: r.upvotedByUser ? r.upvotes - 1 : r.upvotes + 1, upvotedByUser: !r.upvotedByUser }
                  : r
              ),
            }
          : c
      )
    );
  }

  // ── Toggle reply box ──
  function toggleReplyBox(id: number) {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, replyOpen: !c.replyOpen } : c))
    );
  }

  // ── Toggle show replies ──
  function toggleShowReplies(id: number) {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, showReplies: !c.showReplies } : c))
    );
  }

  // ── Submit new comment ──
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) { toast.error(t.nameRequired[lang]); return; }
    if (!newBody.trim()) { toast.error(t.bodyRequired[lang]); return; }
    const initials = newName.trim().split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    const colors = ["#00D4FF", "#A855F7", "#EF4444", "#F97316"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const newComment: Comment = {
      id: Date.now(),
      author: newName.trim(),
      initials,
      avatarColor: color,
      time: lang === "en" ? "just now" : "agora mesmo",
      body: { en: newBody.trim(), pt: newBody.trim() },
      upvotes: 0,
      upvotedByUser: false,
      replies: [],
      showReplies: true,
      replyOpen: false,
    };
    setComments((prev) => [newComment, ...prev]);
    setNewName("");
    setNewBody("");
    toast.success(t.posted[lang]);
    // Announce to screen readers
    if (liveRef.current) liveRef.current.textContent = t.posted[lang];
  }

  // ── Submit reply ──
  function handleReply(commentId: number) {
    const name = (replyNames[commentId] || "").trim();
    const body = (replyTexts[commentId] || "").trim();
    if (!name) { toast.error(t.nameRequired[lang]); return; }
    if (!body) { toast.error(t.bodyRequired[lang]); return; }
    const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    const colors = ["#00D4FF", "#A855F7", "#EF4444", "#F97316"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const newReply: Reply = {
      id: Date.now(),
      author: name,
      initials,
      avatarColor: color,
      time: lang === "en" ? "just now" : "agora mesmo",
      body: { en: body, pt: body },
      upvotes: 0,
      upvotedByUser: false,
    };
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, replies: [...c.replies, newReply], replyOpen: false, showReplies: true }
          : c
      )
    );
    setReplyTexts((prev) => ({ ...prev, [commentId]: "" }));
    setReplyNames((prev) => ({ ...prev, [commentId]: "" }));
    toast.success(t.replyPosted[lang]);
  }

  return (
    <section
      aria-label={lang === "en" ? "Comments section" : "Seção de comentários"}
      style={{ marginTop: "48px", paddingTop: "40px", borderTop: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Screen reader live region */}
      <div ref={liveRef} aria-live="polite" aria-atomic="true" className="sr-only" />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
        <h2
          style={{
            color: "#fff",
            fontFamily: "var(--font-display)",
            fontSize: "1.4rem",
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            margin: 0,
          }}
        >
          <MessageSquare size={20} style={{ color: catColor }} aria-hidden="true" />
          {t.title[lang]}
          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              padding: "2px 10px",
              borderRadius: "20px",
              background: catBg,
              border: `1px solid ${catBorder}`,
              color: catColor,
            }}
          >
            {totalComments}
          </span>
        </h2>

        {/* Sort toggle */}
        <div
          role="group"
          aria-label={lang === "en" ? "Sort comments" : "Ordenar comentários"}
          style={{ display: "flex", gap: "6px" }}
        >
          {(["top", "new"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSortBy(s)}
              aria-pressed={sortBy === s}
              style={{
                padding: "5px 14px",
                borderRadius: "4px",
                fontSize: "0.78rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                border: `1px solid ${sortBy === s ? catBorder : "rgba(255,255,255,0.12)"}`,
                background: sortBy === s ? catBg : "transparent",
                color: sortBy === s ? catColor : "rgba(255,255,255,0.45)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {s === "top" ? t.sortTop[lang] : t.sortNew[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* New comment form */}
      <form
        onSubmit={handleSubmit}
        aria-label={lang === "en" ? "Post a new comment" : "Publicar novo comentário"}
        style={{
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${catBorder}`,
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "32px",
        }}
      >
        <label
          htmlFor={`${formId}-name`}
          style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}
        >
          {lang === "en" ? "Name" : "Nome"}
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <User size={16} aria-hidden="true" style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
          <input
            id={`${formId}-name`}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t.namePlaceholder[lang]}
            maxLength={60}
            autoComplete="name"
            className="focus-neon"
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "5px",
              padding: "8px 12px",
              color: "#fff",
              fontSize: "0.88rem",
              outline: "none",
            }}
          />
        </div>

        <label
          htmlFor={`${formId}-body`}
          style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}
        >
          {lang === "en" ? "Comment" : "Comentário"}
        </label>
        <textarea
          id={`${formId}-body`}
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          placeholder={t.commentPlaceholder[lang]}
          rows={4}
          maxLength={1200}
          className="focus-neon"
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "5px",
            padding: "10px 14px",
            color: "#fff",
            fontSize: "0.88rem",
            lineHeight: 1.6,
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
            marginBottom: "14px",
            fontFamily: "var(--font-body)",
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.72rem" }}>
            {newBody.length}/1200
          </span>
          <button
            type="submit"
            className="focus-neon"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 20px",
              borderRadius: "5px",
              background: catColor,
              color: "#0A0A0B",
              fontWeight: 800,
              fontSize: "0.82rem",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              border: "none",
              cursor: "pointer",
              transition: "opacity 0.2s",
            }}
          >
            <Send size={14} aria-hidden="true" />
            {t.submit[lang]}
          </button>
        </div>
      </form>

      {/* Comments list */}
      {sorted.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.35)", textAlign: "center", padding: "40px 0", fontSize: "0.95rem" }}>
          {t.beFirst[lang]}
        </p>
      ) : (
        <ol aria-label={lang === "en" ? "Comments list" : "Lista de comentários"} style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "20px" }}>
          {sorted.map((comment) => (
            <li key={comment.id}>
              <article
                aria-label={`Comment by ${comment.author}`}
                style={{
                  background: "rgba(255,255,255,0.035)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  padding: "18px 20px",
                }}
              >
                {/* Comment header */}
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <Avatar initials={comment.initials} color={comment.avatarColor} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>{comment.author}</span>
                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}>{comment.time}</span>
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9rem", lineHeight: 1.65, margin: 0 }}>
                      {comment.body[lang]}
                    </p>

                    {/* Comment actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
                      {/* Upvote */}
                      <button
                        type="button"
                        onClick={() => upvoteComment(comment.id)}
                        aria-label={`${comment.upvotedByUser ? "Remove upvote from" : "Upvote"} comment by ${comment.author} — ${comment.upvotes} upvotes`}
                        aria-pressed={comment.upvotedByUser}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "5px 12px",
                          borderRadius: "4px",
                          border: `1px solid ${comment.upvotedByUser ? catBorder : "rgba(255,255,255,0.12)"}`,
                          background: comment.upvotedByUser ? catBg : "transparent",
                          color: comment.upvotedByUser ? catColor : "rgba(255,255,255,0.45)",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        <ThumbsUp size={13} />
                        {comment.upvotes}
                      </button>

                      {/* Reply toggle */}
                      <button
                        type="button"
                        onClick={() => toggleReplyBox(comment.id)}
                        aria-expanded={comment.replyOpen}
                        aria-controls={`reply-form-${comment.id}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "5px 12px",
                          borderRadius: "4px",
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "transparent",
                          color: "rgba(255,255,255,0.45)",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        <MessageSquare size={13} />
                        {t.reply[lang]}
                      </button>

                      {/* Show/hide replies */}
                      {comment.replies.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleShowReplies(comment.id)}
                          aria-expanded={comment.showReplies}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            background: "transparent",
                            border: "none",
                            color: catColor,
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            padding: "5px 4px",
                          }}
                        >
                          {comment.showReplies ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          {comment.replies.length} {t.replies[lang]}
                        </button>
                      )}
                    </div>

                    {/* Reply form */}
                    {comment.replyOpen && (
                      <div
                        id={`reply-form-${comment.id}`}
                        role="form"
                        aria-label={lang === "en" ? `Reply to ${comment.author}` : `Responder a ${comment.author}`}
                        style={{
                          marginTop: "14px",
                          padding: "14px 16px",
                          background: "rgba(255,255,255,0.025)",
                          borderRadius: "6px",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <input
                          type="text"
                          value={replyNames[comment.id] || ""}
                          onChange={(e) => setReplyNames((prev) => ({ ...prev, [comment.id]: e.target.value }))}
                          placeholder={t.namePlaceholder[lang]}
                          maxLength={60}
                          autoComplete="name"
                          aria-label={lang === "en" ? "Your name for reply" : "Seu nome para a resposta"}
                          className="focus-neon"
                          style={{
                            width: "100%",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "4px",
                            padding: "7px 10px",
                            color: "#fff",
                            fontSize: "0.82rem",
                            outline: "none",
                            marginBottom: "8px",
                            boxSizing: "border-box",
                          }}
                        />
                        <textarea
                          value={replyTexts[comment.id] || ""}
                          onChange={(e) => setReplyTexts((prev) => ({ ...prev, [comment.id]: e.target.value }))}
                          placeholder={t.replyPlaceholder[lang]}
                          rows={3}
                          maxLength={600}
                          aria-label={lang === "en" ? `Reply to ${comment.author}` : `Resposta para ${comment.author}`}
                          className="focus-neon"
                          style={{
                            width: "100%",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "4px",
                            padding: "8px 10px",
                            color: "#fff",
                            fontSize: "0.82rem",
                            lineHeight: 1.55,
                            resize: "vertical",
                            outline: "none",
                            boxSizing: "border-box",
                            fontFamily: "var(--font-body)",
                            marginBottom: "10px",
                          }}
                        />
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            onClick={() => toggleReplyBox(comment.id)}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "4px",
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "transparent",
                              color: "rgba(255,255,255,0.45)",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {t.cancel[lang]}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReply(comment.id)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "6px 14px",
                              borderRadius: "4px",
                              background: catColor,
                              color: "#0A0A0B",
                              fontWeight: 800,
                              fontSize: "0.78rem",
                              letterSpacing: "0.05em",
                              textTransform: "uppercase",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            <Send size={12} aria-hidden="true" />
                            {t.postReply[lang]}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Replies list */}
                    {comment.showReplies && comment.replies.length > 0 && (
                      <div
                        style={{ marginTop: "12px", paddingLeft: "16px", borderLeft: `2px solid ${catColor}33` }}
                        role="list"
                        aria-label={lang === "en" ? `Replies to ${comment.author}` : `Respostas para ${comment.author}`}
                      >
                        {comment.replies.map((reply) => (
                          <div key={reply.id} role="listitem">
                            <ReplyCard
                              reply={reply}
                              lang={lang}
                              catColor={catColor}
                              onUpvote={(replyId) => upvoteReply(comment.id, replyId)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
