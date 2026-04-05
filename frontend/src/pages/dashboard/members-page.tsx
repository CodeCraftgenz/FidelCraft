import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Spinner } from '../../components/ui/spinner';

interface Member {
  id: string;
  name: string;
  phone: string;
  pointsBalance: number;
  tierLevel: 'BRONZE' | 'PRATA' | 'OURO' | 'DIAMANTE';
  createdAt: string;
}

const TIER_CONFIG: Record<string, { label: string; className: string }> = {
  BRONZE: { label: 'Bronze', className: 'bg-orange-800/30 text-orange-400 border-orange-600/30' },
  PRATA: { label: 'Prata', className: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  OURO: { label: 'Ouro', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  DIAMANTE: { label: 'Diamante', className: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
};

export function MembersPage() {
  const [search, setSearch] = useState('');

  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: ['members', search],
    queryFn: async () => {
      const response = await api.get('/members', { params: search ? { search } : undefined });
      return response.data.data;
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Membros</h1>
        <p className="mt-1 text-sm text-slate-400">Clientes cadastrados no programa</p>
      </div>

      <div className="max-w-sm">
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <Card className="border-slate-700/50 bg-slate-800/60 p-0 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Nome</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Telefone</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-400">Pontos</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-400">Nivel</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-400">Desde</th>
                  </tr>
                </thead>
                <tbody>
                  {members?.length ? (
                    members.map((member) => {
                      const tier = TIER_CONFIG[member.tierLevel] ?? TIER_CONFIG.BRONZE;
                      return (
                        <tr key={member.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                          <td className="px-4 py-3 font-medium text-white">{member.name}</td>
                          <td className="px-4 py-3 text-slate-300">{member.phone}</td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                            {member.pointsBalance.toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${tier.className}`}>
                              {tier.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500">
                            {new Date(member.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        Nenhum membro encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
