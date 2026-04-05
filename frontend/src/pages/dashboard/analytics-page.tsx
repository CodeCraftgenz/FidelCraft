import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="mt-1 text-sm text-slate-400">Metricas e engajamento</p>
      </div>
      <Card className="border-slate-700/50 bg-slate-800/60">
        <CardHeader>
          <CardTitle className="text-white">Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">Em breve. Esta pagina esta em desenvolvimento.</p>
        </CardContent>
      </Card>
    </div>
  );
}
