import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, ArrowLeftRight, Eye } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Spinner } from '../../components/ui/spinner';

export function AnalyticsPage() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [from, setFrom] = useState(firstOfMonth.toISOString().split('T')[0]);
  const [to, setTo] = useState(today.toISOString().split('T')[0]);

  const { data: stores } = useQuery({ queryKey: ['my-stores'], queryFn: async () => { const r = await api.get('/stores/me/stores').catch(() => null); return r?.data?.data ?? []; } });
  const storeId = (stores as any[])?.[0]?.id;

  const { data: txStats, isLoading } = useQuery({
    queryKey: ['analytics-tx', storeId, from, to],
    queryFn: async () => { if (!storeId) return null; const r = await api.get(`/analytics/store/${storeId}/transactions?from=${from}&to=${to}`).catch(() => null); return r?.data?.data ?? { pointsEarned: 0, pointsRedeemed: 0, transactionCount: 0, totalPurchaseAmount: 0 }; },
    enabled: !!storeId,
  });

  const { data: engagement } = useQuery({
    queryKey: ['analytics-eng', storeId],
    queryFn: async () => { if (!storeId) return null; const r = await api.get(`/analytics/store/${storeId}/engagement`).catch(() => null); return r?.data?.data ?? { totalMembers: 0, activeMembers: 0, engagementRate: '0' }; },
    enabled: !!storeId,
  });

  const { data: topMembers } = useQuery({
    queryKey: ['analytics-top', storeId],
    queryFn: async () => { if (!storeId) return []; const r = await api.get(`/analytics/store/${storeId}/top-members`).catch(() => null); return r?.data?.data ?? []; },
    enabled: !!storeId,
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-2xl font-bold text-white">Analytics</h1><p className="mt-1 text-sm text-slate-400">Metricas e engajamento</p></div>
        <div className="flex gap-3"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" /><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" /></div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Pontos Emitidos', value: txStats?.pointsEarned ?? 0, icon: TrendingUp, color: 'text-emerald-400' },
          { title: 'Pontos Resgatados', value: txStats?.pointsRedeemed ?? 0, icon: ArrowLeftRight, color: 'text-orange-400' },
          { title: 'Transacoes', value: txStats?.transactionCount ?? 0, icon: Eye, color: 'text-blue-400' },
          { title: 'Engajamento', value: `${engagement?.engagementRate ?? 0}%`, icon: Users, color: 'text-purple-400' },
        ].map((c) => (
          <Card key={c.title} className="border-slate-700/50 bg-slate-800/60">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400">{c.title}</CardTitle></CardHeader>
            <CardContent><div className="flex items-center gap-2"><c.icon className={c.color} size={20} /><span className={`text-2xl font-bold ${c.color}`}>{typeof c.value === 'number' ? c.value.toLocaleString('pt-BR') : c.value}</span></div></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-700/50 bg-slate-800/60">
          <CardHeader><CardTitle className="text-white">Membros</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Total</span><span className="text-white font-medium">{engagement?.totalMembers ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Ativos (30 dias)</span><span className="text-emerald-400 font-medium">{engagement?.activeMembers ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Receita associada</span><span className="text-white font-medium">R${(txStats?.totalPurchaseAmount ?? 0).toFixed(2)}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700/50 bg-slate-800/60">
          <CardHeader><CardTitle className="text-white">Top Membros</CardTitle></CardHeader>
          <CardContent>
            {(topMembers as any[])?.length ? (
              <div className="space-y-3">{(topMembers as any[]).slice(0, 5).map((m: any, i: number) => (
                <div key={m.id} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-400">{i + 1}</span>
                  <div className="flex-1"><p className="text-sm font-medium text-white">{m.name}</p></div>
                  <span className="text-sm text-slate-400">{m._count?.transactions ?? 0} transacoes</span>
                </div>
              ))}</div>
            ) : <p className="text-slate-500">Nenhum membro ainda.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
