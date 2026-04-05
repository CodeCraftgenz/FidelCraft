import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Spinner } from '../../components/ui/spinner';

interface Stats {
  totalMembers: number;
  transactionsToday: number;
  pointsEarnedThisMonth: number;
  engagementRate: number;
}

export function OverviewPage() {
  const { data: stores } = useQuery({ queryKey: ['my-stores'], queryFn: async () => { const r = await api.get('/stores/me/stores').catch(() => null); return r?.data?.data ?? []; } });
  const storeId = (stores as any[])?.[0]?.id;

  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['dashboard-stats', storeId],
    queryFn: async () => {
      const response = await api.get(`/analytics/store/${storeId}/dashboard`).catch(() => null);
      return response?.data?.data ?? { totalMembers: 0, transactionsToday: 0, pointsEarnedThisMonth: 0, engagementRate: 0 };
    },
    enabled: !!storeId,
  });

  const { data: recentTransactions, isLoading: loadingTx } = useQuery({
    queryKey: ['dashboard-recent-transactions', storeId],
    queryFn: async () => {
      const response = await api.get(`/transactions/store/${storeId}`, { params: { limit: 5 } }).catch(() => null);
      return response?.data?.data ?? [];
    },
    enabled: !!storeId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  const cards = [
    { title: 'Total de Membros', value: stats?.totalMembers ?? 0, icon: '👥', color: 'text-emerald-400' },
    { title: 'Transacoes Hoje', value: stats?.transactionsToday ?? 0, icon: '📊', color: 'text-blue-400' },
    { title: 'Pontos no Mes', value: (stats?.pointsEarnedThisMonth ?? 0).toLocaleString('pt-BR'), icon: '⭐', color: 'text-yellow-400' },
    { title: 'Taxa de Engajamento', value: `${stats?.engagementRate ?? 0}%`, icon: '📈', color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Painel Geral</h1>
        <p className="mt-1 text-sm text-slate-400">Visao geral do seu programa de fidelidade</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title} className="border-slate-700/50 bg-slate-800/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${card.color}`}>{card.value}</span>
                <span className="text-lg">{card.icon}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-700/50 bg-slate-800/60">
        <CardHeader>
          <CardTitle className="text-white">Transacoes Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTx ? (
            <Spinner />
          ) : recentTransactions?.length ? (
            <div className="space-y-3">
              {recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between rounded-lg bg-slate-700/30 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{tx.memberName ?? 'Membro'}</p>
                    <p className="text-xs text-slate-400">{tx.programName ?? 'Programa'}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${tx.type === 'EARN' ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {tx.type === 'EARN' ? '+' : '-'}{tx.points} pts
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(tx.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhuma transacao recente.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
