import { useQuery, useMutation } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Spinner } from '../../components/ui/spinner';

const PLANS = [
  { name: 'PRO', price: 'R$49', desc: '3 programas, 500 membros, campanhas, analytics' },
  { name: 'BUSINESS', price: 'R$99', desc: '3 lojas, 2000 membros, 10 funcionarios' },
  { name: 'ENTERPRISE', price: 'R$199', desc: 'Ilimitado, API, whitelabel' },
];

export function BillingPage() {
  const { data: billing, isLoading } = useQuery({
    queryKey: ['billing'],
    queryFn: async () => { const r = await api.get('/payments/me/billing').catch(() => null); return r?.data?.data ?? { currentPlan: 'FREE', daysRemaining: 0, payments: [] }; },
  });

  const checkout = useMutation({
    mutationFn: async ({ plan, cycle }: { plan: string; cycle: string }) => { const r = await api.post('/payments/checkout', { plan, billingCycle: cycle }); return r.data.data; },
    onSuccess: (data) => { if (data?.checkoutUrl) window.open(data.checkoutUrl, '_blank'); },
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Assinatura</h1><p className="mt-1 text-sm text-slate-400">Gerencie seu plano</p></div>

      <Card className="border-slate-700/50 bg-slate-800/60">
        <CardHeader><CardTitle className="text-white">Plano Atual</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span className="rounded-lg bg-emerald-500/20 px-4 py-2 text-lg font-bold text-emerald-400">{billing?.currentPlan || 'FREE'}</span>
            {billing?.daysRemaining > 0 && <span className="text-sm text-slate-400">{billing.daysRemaining} dias restantes</span>}
            {billing?.needsRenewal && <span className="rounded bg-yellow-500/20 px-2 py-1 text-xs text-yellow-400">Renovar</span>}
          </div>
          {billing?.daysRemaining > 0 && (
            <div className="mt-3 h-2 w-full max-w-md rounded-full bg-slate-700">
              <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (billing.daysRemaining / 30) * 100)}%` }} />
            </div>
          )}
        </CardContent>
      </Card>

      <div><h2 className="mb-4 text-lg font-semibold text-white">Planos</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <Card key={plan.name} className={`border-slate-700/50 ${billing?.currentPlan === plan.name ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-800/60'}`}>
              <CardHeader><CardTitle className="text-white">{plan.name}</CardTitle><p className="text-2xl font-bold text-emerald-400">{plan.price}<span className="text-sm text-slate-400">/mes</span></p></CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-slate-400">{plan.desc}</p>
                {billing?.currentPlan === plan.name ? (
                  <div className="flex items-center gap-2 text-green-400"><Check size={16} /> Plano atual</div>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => checkout.mutate({ plan: plan.name, cycle: 'MONTHLY' })} loading={checkout.isPending}>Mensal</Button>
                    <Button size="sm" variant="outline" onClick={() => checkout.mutate({ plan: plan.name, cycle: 'YEARLY' })}>Anual (-20%)</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="border-slate-700/50 bg-slate-800/60">
        <CardHeader><CardTitle className="text-white">Historico</CardTitle></CardHeader>
        <CardContent>
          {billing?.payments?.length ? (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-700 text-slate-400"><th className="py-3 text-left">Data</th><th className="text-left">Plano</th><th className="text-left">Valor</th><th className="text-left">Status</th></tr></thead>
              <tbody>{billing.payments.map((p: any) => (
                <tr key={p.id} className="border-b border-slate-700/50">
                  <td className="py-3 text-slate-300">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td className="text-slate-300">{p.plan || '-'}</td>
                  <td className="text-white font-medium">R${p.amount?.toFixed(2)}</td>
                  <td><span className={`rounded px-2 py-0.5 text-xs ${p.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{p.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          ) : <p className="text-slate-500">Nenhum pagamento registrado.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
