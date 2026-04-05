import { Link } from 'react-router-dom';
import { QrCode, Gift, TrendingUp, BarChart3, Smartphone, Users } from 'lucide-react';

const FEATURES = [
  { icon: QrCode, title: 'QR Code Facil', desc: 'Cliente escaneia o QR e ja acumula pontos em segundos' },
  { icon: Gift, title: 'Premios Customizaveis', desc: 'Crie premios que seus clientes realmente querem resgatar' },
  { icon: TrendingUp, title: '3 Tipos de Programa', desc: 'Pontos por valor, carimbos por visita ou cashback automatico' },
  { icon: BarChart3, title: 'Analytics Detalhado', desc: 'Engajamento, retencao, top clientes e premios mais resgatados' },
  { icon: Smartphone, title: 'PWA sem App Store', desc: 'Seus clientes acessam pelo celular sem precisar baixar nada' },
  { icon: Users, title: 'Niveis e Campanhas', desc: 'Bronze, Prata, Ouro, Diamante + pontos em dobro e bonus' },
];

const PLANS = [
  { name: 'Free', price: 'R$0', features: ['1 loja', '1 programa', '50 membros', '100 transacoes/mes'] },
  { name: 'Pro', price: 'R$49/mes', features: ['3 programas', '500 membros', 'Campanhas', 'Analytics', 'Push notifications'], highlight: true },
  { name: 'Business', price: 'R$99/mes', features: ['3 lojas', 'Programas ilimitados', '2000 membros', '10 funcionarios', 'Tudo do Pro'] },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-bg-dark text-white">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="font-heading text-2xl font-bold">Fidel<span className="text-brand-primary">Craft</span></span>
        <div className="flex gap-3">
          <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:text-white">Entrar</Link>
          <Link to="/register" className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Comecar Gratis</Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="font-heading text-5xl font-bold leading-tight lg:text-6xl">
          Fidelidade digital<br /><span className="text-brand-primary">sem cartao de papel</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          Seus clientes escaneiam o QR, acumulam pontos e resgatam premios. Voce acompanha tudo em tempo real.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/register" className="rounded-xl bg-brand-primary px-8 py-4 text-lg font-semibold hover:opacity-90">Comecar Gratis</Link>
          <Link to="/l/cafe-do-joao" className="rounded-xl border border-slate-600 px-8 py-4 text-lg font-semibold hover:bg-slate-800">Ver Demo</Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center font-heading text-3xl font-bold">Tudo que voce precisa</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-slate-800 bg-brand-bg-card p-6">
              <Icon className="h-10 w-10 text-brand-primary" />
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center font-heading text-3xl font-bold">Planos</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`rounded-xl border p-6 ${plan.highlight ? 'border-brand-primary bg-brand-primary/5' : 'border-slate-800 bg-brand-bg-card'}`}>
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="mt-2 text-3xl font-bold">{plan.price}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="text-brand-primary">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className={`mt-6 block rounded-lg py-3 text-center text-sm font-semibold ${plan.highlight ? 'bg-brand-primary text-white' : 'border border-slate-600 hover:bg-slate-800'}`}>
                Escolher {plan.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 py-8 text-center text-sm text-slate-500">
        FidelCraft &copy; {new Date().getFullYear()}. Todos os direitos reservados.
      </footer>
    </div>
  );
}
