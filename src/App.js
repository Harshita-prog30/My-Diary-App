// App.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon,
  Sun,
  Plus,
  Trash2,
  Edit2,
  Save,
  LogOut,
  Search,
  Tag,
} from "lucide-react";

import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import LoginPage from "./LoginPage";
import { FcGoogle } from "react-icons/fc";


// ------------------ Helpers ------------------
const uid = () => Math.random().toString(36).slice(2);
const todayISO = () => new Date().toISOString();

const QUOTES = [
  "Believe you can and you're halfway there.",
  "Little progress each day adds up to big results.",
  "Your future is created by what you do today.",
  "Start where you are. Use what you have. Do what you can.",
  "Discipline is choosing what you want most over what you want now.",
];

const LS = {
  THEME: "diary.theme",
  NOTES: (email) => `diary.notes.${email || "guest"}`,
};

// ------------------ Theme ------------------
function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(LS.THEME) || "light"
  );
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem(LS.THEME, theme);
  }, [theme]);
  return { theme, setTheme };
}

// ------------------ Notes Store ------------------
function useNotes(email) {
  const key = LS.NOTES(email);
  const [notes, setNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(notes));
  }, [key, notes]);

  const addNote = (partial) => {
    const n = {
      id: uid(),
      title: partial.title?.trim() || "Untitled",
      html: partial.html || "",
      tags: partial.tags || [],
      createdAt: todayISO(),
      updatedAt: todayISO(),
    };
    setNotes((prev) => [n, ...prev]);
  };

  const updateNote = (id, patch) =>
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: todayISO() } : n
      )
    );

  const deleteNote = (id) =>
    setNotes((prev) => prev.filter((n) => n.id !== id));

  return { notes, addNote, updateNote, deleteNote };
}

// ------------------ UI Pieces ------------------
function TopBar({ theme, setTheme, onLogout, onNew, user }) {
  const username =
    user?.displayName || user?.email?.split("@")[0] || "Guest";

  return (
    <div className="sticky top-0 z-40 backdrop-blur bg-white/60 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
      <h1 className="text-xl md:text-2xl font-bold tracking-tight">
        📔 {username}’s Diary
      </h1>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onNew}
          className="px-3 py-2 rounded-2xl shadow-sm bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 flex items-center gap-2"
        >
          <Plus size={18} /> New Note
        </button>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="px-3 py-2 rounded-2xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          onClick={onLogout}
          className="px-3 py-2 rounded-2xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
}

function MotivationBanner() {
  const [hide, setHide] = useState(false);
  const quote = useMemo(
    () => QUOTES[Math.floor(Math.random() * QUOTES.length)],
    []
  );
  if (hide) return null;
  return (
    <div className="mx-4 my-3 rounded-2xl bg-gradient-to-r from-fuchsia-200 to-pink-200 dark:from-fuchsia-900/40 dark:to-pink-900/30 border border-fuchsia-300/60 dark:border-fuchsia-800/40 p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="italic">“{quote}”</p>
        <button
          className="text-sm px-3 py-1 rounded-xl bg-white/50 dark:bg-zinc-800/60 border border-white/60 dark:border-zinc-700"
          onClick={() => setHide(true)}
        >
          Close
        </button>
      </div>
    </div>
  );
}

function NoteCard({ note, onEdit, onDelete }) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h3
          className="font-semibold text-lg flex-1 truncate"
          dangerouslySetInnerHTML={{ __html: note.title || "Untitled" }}
        />
        <button
          onClick={onEdit}
          className="px-2 py-1 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={onDelete}
          className="px-2 py-1 rounded-xl border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div
        className="prose prose-zinc dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: note.html }}
      />
      <div className="flex flex-wrap gap-2 pt-2">
        {note.tags?.map((t) => (
          <span
            key={t}
            className="text-xs px-2 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
          >
            #{t}
          </span>
        ))}
      </div>
      <div className="text-xs text-zinc-500 mt-1">
        {new Date(note.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}

function EditorModal({ open, onClose, initial, onSave }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [html, setHtml] = useState(initial?.html || "");
  const [tagsInput, setTagsInput] = useState(
    (initial?.tags || []).join(", ")
  );
  const quillRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title || "");
      setHtml(initial?.html || "");
      setTagsInput((initial?.tags || []).join(", "));
    }
  }, [open, initial]);

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", { color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "blockquote", "code"],
        ["clean"],
      ],
    }),
    []
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <input
            className="flex-1 px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button
            onClick={() => {
              onSave({
                title: title || "Untitled",
                html,
                tags: tagsInput
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              });
              onClose();
            }}
            className="px-3 py-2 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center gap-2"
          >
            <Save size={16} /> Save
          </button>
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-2xl border border-zinc-300 dark:border-zinc-700"
          >
            Close
          </button>
        </div>
        <div className="mb-2 flex items-center gap-2">
          <Tag size={16} />
          <input
            className="flex-1 px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent"
            placeholder="tags, comma, separated"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
        </div>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={html}
          onChange={setHtml}
          modules={modules}
          className="rounded-xl overflow-hidden bg-white dark:bg-zinc-800"
        />
      </motion.div>
    </div>
  );
}

function SearchAndFilter({ query, setQuery, tag, setTag }) {
  return (
    <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between px-4">
      <div className="flex items-center gap-2 flex-1">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2"
            size={16}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-10 pr-3 py-2 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-transparent"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm">Filter tag:</span>
        <input
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="#happy"
          className="px-3 py-2 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-transparent"
        />
      </div>
    </div>
  );
}

// ------------------ Main App ------------------
export default function App() {
  const [user, setUser] = useState(null);
  const { theme, setTheme } = useTheme();
  const { notes, addNote, updateNote, deleteNote } = useNotes(user?.email);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const [filterTag, setFilterTag] = useState("");

  // Firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);
const loginWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Google Login Error:", error.message);
  }
};


  const logoutUser = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };
  {user ? (
  <div>
    <p>Welcome {user.displayName}</p>
    <button onClick={logoutUser}>Logout</button>
  </div>
) : (
  <button onClick={loginWithGoogle}>Login with Google</button>
)}


  // 🔍 Search + Tag filter
  const filtered = useMemo(() => {
    return notes.filter((n) => {
      const text = (n.title + " " + n.html).toLowerCase();
      const q = query.toLowerCase();
      const matchQ = !q || text.includes(q);

      const matchTag =
        !filterTag ||
        (n.tags || []).some((t) =>
          `#${t}`.toLowerCase().includes(
            filterTag.toLowerCase().replace(/^#/, "#")
          )
        );

      return matchQ && matchTag;
    });
  }, [notes, query, filterTag]);

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-pink-50 to-violet-100 dark:from-zinc-900 dark:to-zinc-950 p-4">
        <button
          onClick={loginWithGoogle}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Login with Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <TopBar
        theme={theme}
        setTheme={setTheme}
        onLogout={logoutUser}
        onNew={() => {
          setEditing(null);
          setModalOpen(true);
        }}
        user={user}
      />

      <div className="max-w-6xl mx-auto py-4">
        <MotivationBanner />

        <SearchAndFilter
          query={query}
          setQuery={setQuery}
          tag={filterTag}
          setTag={setFilterTag}
        />

        {/* Notes Grid */}
        <div className="px-4 mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((n) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <NoteCard
                  note={n}
                  onEdit={() => {
                    setEditing(n);
                    setModalOpen(true);
                  }}
                  onDelete={() => deleteNote(n.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="px-4 mt-10 text-center text-zinc-500">
            No notes yet. Click <b>New Note</b> to start journaling ✨
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <EditorModal
        open={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSave={(data) => {
          if (editing) updateNote(editing.id, data);
          else addNote(data);
        }}
      />
    </div>
  );
}
