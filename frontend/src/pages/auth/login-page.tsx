import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/auth-provider';
import { AuthLayout } from '../../components/layouts/auth-layout';
import { Button, Input } from '../../components/ui';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result?.requires2FA) {
        navigate('/login-2fa', { state: { email } });
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao fazer login');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Entrar" subtitle="Acesse sua conta">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <Input label="Email" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required />
        <Input label="Senha" id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" required />
        <div className="flex justify-end"><Link to="/forgot-password" className="text-sm text-primary hover:underline">Esqueci a senha</Link></div>
        <Button type="submit" loading={loading} className="w-full">Entrar</Button>
        <p className="text-center text-sm text-muted-foreground">Nao tem conta? <Link to="/register" className="text-primary hover:underline">Criar conta</Link></p>
      </form>
    </AuthLayout>
  );
}
