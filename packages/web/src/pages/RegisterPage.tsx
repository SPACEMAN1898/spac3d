import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_ROUTES, registerSchema } from "@clinikchat/shared";
import { api } from "../lib/api.js";
import { useAuthStore } from "../stores/authStore.js";
import { connectSocket } from "../lib/socket.js";

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = registerSchema.safeParse({ email, password, displayName });
    if (!parsed.success) {
      setError("Please fix the form: use a valid email, password (8+ chars), and display name.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<{
        success: true;
        data: {
          user: import("@clinikchat/shared").User;
          accessToken: string;
          refreshToken: string;
        };
      }>(API_ROUTES.AUTH.REGISTER, parsed.data);
      if (!data.success) return;
      setSession(data.data.user, data.data.accessToken, data.data.refreshToken);
      try {
        connectSocket();
      } catch {
        /* socket optional until API up */
      }
      void navigate("/app");
    } catch {
      setError("Registration failed. The email may already be in use.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">Join ClinikChat</p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="name">
              Display name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={displayName}
              onChange={(ev) => setDisplayName(ev.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="font-medium text-indigo-600 hover:text-indigo-500" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
