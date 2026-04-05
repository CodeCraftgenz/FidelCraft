import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { AuthLayout } from '../../components/layouts/auth-layout';
import { Button, Input } from '../../components/ui';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { await api.post('/auth/forgot-password', { email }); setSent(true); }
    catch {} finally { setLoading(false); }
  };

  if (sent) return (
    <AuthLayout title="Email Enviado" subtitle="Verifique sua caixa de entrada">
      <p className="text-center text-muted-foreground">Se o email existir, enviaremos um link de recuperacao.</p>
      <Link to="/login" className="mt-4 block text-center text-primary hover:underline">Voltar ao login</Link>
    </AuthLayout>
  );

  return (
    <AuthLayout title="Recuperar Senha" subtitle="Informe seu email">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Button type="submit" loading={loading} className="w-full">Enviar Link</Button>
        <Link to="/login" className="block text-center text-sm text-muted-foreground hover:underline">Voltar ao login</Link>
      </form>
    </AuthLayout>
  );
}
