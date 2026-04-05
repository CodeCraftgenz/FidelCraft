import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/auth-provider';
import { AuthLayout } from '../../components/layouts/auth-layout';
import { Button, Input } from '../../components/ui';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Senhas nao conferem'); return; }
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao criar conta');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Criar Conta" subtitle="Comece gratis">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <Input label="Nome" id="name" value={form.name} onChange={set('name')} placeholder="Seu nome" required />
        <Input label="Email" id="email" type="email" value={form.email} onChange={set('email')} placeholder="seu@email.com" required />
        <Input label="Senha" id="password" type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 caracteres" required />
        <Input label="Confirmar Senha" id="confirmPassword" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repita a senha" required />
        <Button type="submit" loading={loading} className="w-full">Criar Conta</Button>
        <p className="text-center text-sm text-muted-foreground">Ja tem conta? <Link to="/login" className="text-primary hover:underline">Entrar</Link></p>
      </form>
    </AuthLayout>
  );
}
