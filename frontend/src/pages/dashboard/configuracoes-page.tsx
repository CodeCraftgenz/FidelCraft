import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../providers/auth-provider';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Spinner } from '../../components/ui/spinner';

export function ConfiguracoesPage() {
  const { user, logout } = useAuth();

  const { data: planInfo, isLoading } = useQuery({
    queryKey: ['my-plan'],
    queryFn: async () => { const r = await api.get('/payments/me/plan').catch(() => null); return r?.data?.data ?? { plan: 'FREE' }; },
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Configuracoes</h1><p className="mt-1 text-sm text-slate-400">Preferencias do sistema</p></div>

      <Card className="border-slate-700/50 bg-slate-800/60">
        <CardHeader><CardTitle className="text-white">Conta</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Nome</span><span className="text-white">{user?.name}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Email</span><span className="text-white">{user?.email}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Plano</span><span className="font-medium text-emerald-400">{planInfo?.plan || 'FREE'}</span></div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-700/50 bg-slate-800/60">
        <CardHeader><CardTitle className="text-white">Notificacoes</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['Novos membros', 'Resgates de premios', 'Campanhas expirando', 'Relatorio semanal'].map((label) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{label}</span>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" defaultChecked className="peer sr-only" />
                  <div className="peer h-6 w-11 rounded-full bg-slate-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-full" />
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-500/20 bg-red-500/5">
        <CardHeader><CardTitle className="text-red-400">Zona de Perigo</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-slate-400">Ao sair, voce sera redirecionado para a pagina de login.</p>
          <Button variant="destructive" onClick={logout}>Sair da Conta</Button>
        </CardContent>
      </Card>
    </div>
  );
}
