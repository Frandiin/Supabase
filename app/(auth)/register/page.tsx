"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Zap, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileError } = await (supabase as any).from("profiles").insert({
        id: data.user.id,
        username,
        reputation_score: 50,
      });

      if (profileError && profileError.code !== "23505") {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      router.push("/marketplace");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-yellow-400/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-yellow-400/30 bg-yellow-400/10">
              <Zap className="h-5 w-5 text-yellow-400" />
            </div>
            <span className="text-xl font-black text-gradient">PokéTrade</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold">Criar sua conta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Junte-se a milhares de traders de Pokémon
          </p>
        </div>

        <div className="pokemon-card p-6">
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="AshKetchum"
                  className="input-field pl-10"
                  required
                  minLength={3}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trainer@pokemon.com"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mín. 8 caracteres"
                  className="input-field pl-10 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Reputation Starting Info */}
            <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-3 text-xs text-muted-foreground">
              <span className="text-yellow-400 font-medium">💡 Info:</span> Você
              começa com reputação 50/100. Para vender cartas, é necessário
              reputação mínima de 50.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
              id="register-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar conta grátis"
              )}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="text-yellow-400 font-medium hover:text-yellow-300 transition-colors"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
