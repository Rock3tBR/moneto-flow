import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';

const AuthPage = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email || !password) { setError('Preencha todos os campos.'); return; }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }

    setSubmitting(true);
    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) setError(error.message === 'Invalid login credentials' ? 'Email ou senha incorretos.' : error.message);
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message.includes('already registered') ? 'Este email já está cadastrado.' : error.message);
      } else {
        setSuccess('Conta criada! Verifique seu email para confirmar.');
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      {/* Decorative blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full gradient-primary blob-glow" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full gradient-income blob-glow" />

      <div className="w-full max-w-md glass-strong rounded-5xl p-8 shadow-2xl animate-in relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 gradient-primary rounded-3xl flex items-center justify-center mb-4 shadow-lg">
            <Wallet className="w-8 h-8 text-foreground" />
          </div>
          <h1 className="text-3xl font-black text-foreground">Moneto</h1>
          <p className="text-muted-foreground text-sm mt-1 uppercase tracking-widest">Controle financeiro</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-muted rounded-2xl text-foreground border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-muted rounded-2xl text-foreground border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-expense text-sm text-center">{error}</p>}
          {success && <p className="text-income text-sm text-center">{success}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 gradient-primary rounded-2xl text-foreground font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? '...' : isLogin ? 'Entrar' : 'Criar Conta'}
          </button>
        </form>

        <p className="text-center text-muted-foreground text-sm mt-6">
          {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }} className="text-primary font-semibold hover:underline">
            {isLogin ? 'Cadastre-se' : 'Entrar'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
