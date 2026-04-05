import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Spinner } from '../../components/ui/spinner';

interface Transaction {
  id: string;
  type: 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST' | 'BONUS';
  points: number;
  memberName: string;
  programName: string;
  description?: string;
  createdAt: string;
}

const TYPE_STYLE: Record<string, { label: string; className: string; sign: string }> = {
  EARN: { label: 'Ganho', className: 'bg-emerald-500/20 text-emerald-400', sign: '+' },
  REDEEM: { label: 'Resgate', className: 'bg-orange-500/20 text-orange-400', sign: '-' },
  EXPIRE: { label: 'Expirado', className: 'bg-red-500/20 text-red-400', sign: '-' },
  ADJUST: { label: 'Ajuste', className: 'bg-slate-500/20 text-slate-400', sign: '' },
  BONUS: { label: 'Bonus', className: 'bg-purple-500/20 text-purple-400', sign: '+' },
};

export function TransactionsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ memberPhone: '', purchaseAmount: '', programId: '' });

  const { data: programs } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['programs'],
    queryFn: async () => {
      const response = await api.get('/programs').catch(() => ({ data: { data: [] } }));
      return response.data.data;
    },
  });

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await api.get('/transactions', { params: { limit: 20 } }).catch(() => ({ data: { data: [] } }));
      return response.data.data;
    },
  });

  const earnMutation = useMutation({
    mutationFn: (data: { memberPhone: string; purchaseAmount: number; programId: string }) =>
      api.post('/transactions/earn', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setForm({ memberPhone: '', purchaseAmount: '', programId: '' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    earnMutation.mutate({
      memberPhone: form.memberPhone,
      purchaseAmount: Number(form.purchaseAmount),
      programId: form.programId,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Transacoes</h1>
        <p className="mt-1 text-sm text-slate-400">Registre vendas e veja o historico</p>
      </div>

      <Card className="border-emerald-500/20 bg-slate-800/60">
        <CardHeader>
          <CardTitle className="text-white">Registrar Venda</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Input
              label="Telefone do Membro"
              placeholder="(11) 99999-9999"
              value={form.memberPhone}
              onChange={(e) => setForm({ ...form, memberPhone: e.target.value })}
              required
            />
            <Input
              label="Valor da Compra (R$)"
              type="number"
              min={0.01}
              step={0.01}
              placeholder="0,00"
              value={form.purchaseAmount}
              onChange={(e) => setForm({ ...form, purchaseAmount: e.target.value })}
              required
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Programa</label>
              <select
                value={form.programId}
                onChange={(e) => setForm({ ...form, programId: e.target.value })}
                required
                className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Selecione...</option>
                {programs?.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" loading={earnMutation.isPending} className="w-full">
                Registrar Pontos
              </Button>
            </div>
          </form>
          {earnMutation.isError && (
            <p className="mt-3 text-sm text-red-400">Erro ao registrar. Verifique o telefone e tente novamente.</p>
          )}
          {earnMutation.isSuccess && (
            <p className="mt-3 text-sm text-emerald-400">Pontos registrados com sucesso!</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-700/50 bg-slate-800/60">
        <CardHeader>
          <CardTitle className="text-white">Historico de Transacoes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Spinner />
          ) : transactions?.length ? (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const style = TYPE_STYLE[tx.type] ?? TYPE_STYLE.ADJUST;
                return (
                  <div key={tx.id} className="flex items-center justify-between rounded-lg bg-slate-700/30 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${style.className}`}>
                        {style.label}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-white">{tx.memberName}</p>
                        <p className="text-xs text-slate-500">{tx.programName}{tx.description ? ` - ${tx.description}` : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${style.className.includes('emerald') ? 'text-emerald-400' : style.className.includes('orange') ? 'text-orange-400' : style.className.includes('red') ? 'text-red-400' : style.className.includes('purple') ? 'text-purple-400' : 'text-slate-400'}`}>
                        {style.sign}{tx.points.toLocaleString('pt-BR')} pts
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(tx.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhuma transacao encontrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
