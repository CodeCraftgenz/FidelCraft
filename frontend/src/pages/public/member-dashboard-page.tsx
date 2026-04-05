import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Spinner } from '../../components/ui/spinner';

interface MemberDashboard {
  member: {
    id: string;
    name: string;
    phone: string;
    tierLevel: 'BRONZE' | 'PRATA' | 'OURO' | 'DIAMANTE';
    tierProgress: number;
    nextTierAt: number;
  };
  storeName: string;
  programs: {
    id: string;
    name: string;
    type: string;
    balance: number;
  }[];
  rewards: {
    id: string;
    name: string;
    pointsCost: number;
    stock: number;
  }[];
  recentTransactions: {
    id: string;
    type: 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST' | 'BONUS';
    points: number;
    programName: string;
    createdAt: string;
  }[];
}

const TIER_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  BRONZE: { label: 'Bronze', color: 'text-orange-400', bgColor: 'bg-orange-400' },
  PRATA: { label: 'Prata', color: 'text-slate-300', bgColor: 'bg-slate-300' },
  OURO: { label: 'Ouro', color: 'text-yellow-400', bgColor: 'bg-yellow-400' },
  DIAMANTE: { label: 'Diamante', color: 'text-cyan-300', bgColor: 'bg-cyan-300' },
};

const TX_STYLE: Record<string, { sign: string; color: string }> = {
  EARN: { sign: '+', color: 'text-emerald-400' },
  REDEEM: { sign: '-', color: 'text-orange-400' },
  EXPIRE: { sign: '-', color: 'text-red-400' },
  ADJUST: { sign: '', color: 'text-slate-400' },
  BONUS: { sign: '+', color: 'text-purple-400' },
};

export function MemberDashboardPage() {
  const { memberId } = useParams<{ memberId: string }>();

  const { data, isLoading } = useQuery<MemberDashboard>({
    queryKey: ['member-dashboard', memberId],
    queryFn: async () => {
      const response = await api.get(`/members/dashboard/${memberId}`);
      return response.data.data;
    },
    enabled: !!memberId,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <p className="text-slate-400">Membro nao encontrado.</p>
      </div>
    );
  }

  const { member, storeName, programs, rewards, recentTransactions } = data;
  const tier = TIER_CONFIG[member.tierLevel] ?? TIER_CONFIG.BRONZE;
  const progressPercent = member.nextTierAt > 0
    ? Math.min(100, Math.round((member.tierProgress / member.nextTierAt) * 100))
    : 100;

  const qrValue = `${window.location.origin}/membro/${memberId}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="mb-8 text-center">
          <p className="text-sm text-slate-400">{storeName}</p>
          <h1 className="mt-1 text-2xl font-bold text-white">{member.name}</h1>
          <span className={`mt-2 inline-block rounded-full bg-slate-800 px-3 py-1 text-sm font-semibold ${tier.color}`}>
            {tier.label}
          </span>
        </div>

        {/* QR Code */}
        <Card className="mb-6 border-slate-700/50 bg-slate-800/60">
          <CardContent className="flex flex-col items-center py-6">
            <div className="rounded-xl bg-white p-3">
              <QRCodeSVG value={qrValue} size={160} level="M" />
            </div>
            <p className="mt-3 text-xs text-slate-500">Apresente este QR code ao fazer compras</p>
          </CardContent>
        </Card>

        {/* Tier Progress */}
        <Card className="mb-6 border-slate-700/50 bg-slate-800/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Progresso do Nivel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className={tier.color}>{tier.label}</span>
              <span className="text-slate-500">{member.tierProgress.toLocaleString('pt-BR')} / {member.nextTierAt.toLocaleString('pt-BR')} pts</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-700">
              <div
                className={`h-full rounded-full transition-all ${tier.bgColor}`}
                style={{ width: `${progressPercent}%`, opacity: 0.8 }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Program Balances */}
        <div className="mb-6 grid grid-cols-1 gap-3">
          {programs.map((program) => (
            <Card key={program.id} className="border-slate-700/50 bg-slate-800/60">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium text-white">{program.name}</p>
                  <p className="text-xs text-slate-500">{program.type === 'CASHBACK' ? 'Cashback' : 'Pontos'}</p>
                </div>
                <span className="text-2xl font-bold text-emerald-400">
                  {program.type === 'CASHBACK' ? `R$ ${program.balance.toFixed(2)}` : program.balance.toLocaleString('pt-BR')}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Available Rewards */}
        {rewards.length > 0 && (
          <Card className="mb-6 border-slate-700/50 bg-slate-800/60">
            <CardHeader>
              <CardTitle className="text-white">Recompensas Disponiveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rewards.map((reward) => (
                  <div key={reward.id} className="flex items-center justify-between rounded-lg bg-slate-700/40 px-3 py-2.5">
                    <span className="text-sm text-white">{reward.name}</span>
                    <span className="text-sm font-semibold text-emerald-400">
                      {reward.pointsCost.toLocaleString('pt-BR')} pts
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Transactions */}
        <Card className="border-slate-700/50 bg-slate-800/60">
          <CardHeader>
            <CardTitle className="text-white">Historico Recente</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-2">
                {recentTransactions.map((tx) => {
                  const style = TX_STYLE[tx.type] ?? TX_STYLE.ADJUST;
                  return (
                    <div key={tx.id} className="flex items-center justify-between rounded-lg bg-slate-700/30 px-3 py-2.5">
                      <div>
                        <p className="text-sm text-white">{tx.programName}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(tx.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className={`text-sm font-semibold ${style.color}`}>
                        {style.sign}{tx.points.toLocaleString('pt-BR')} pts
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Nenhuma transacao ainda.</p>
            )}
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs text-slate-600">
          Powered by <span className="font-semibold text-emerald-500">FidelCraft</span>
        </p>
      </div>
    </div>
  );
}
