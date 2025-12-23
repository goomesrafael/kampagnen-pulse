import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Radar, Eye, EyeOff, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { toast } from '@/hooks/use-toast';

/**
 * LOGIN FIXO
 */
const FIXED_EMAIL = 'news@greendot.it';
const FIXED_PASSWORD = 'Sasafu68!';

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const isGerman = i18n.language === 'de';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await new Promise((r) => setTimeout(r, 600));

    const success =
      email === FIXED_EMAIL && password === FIXED_PASSWORD;

    if (!success) {
      toast({
        title: isGerman ? 'Login fehlgeschlagen' : 'Login inválido',
        description: isGerman
          ? 'E-Mail oder Passwort ist falsch'
          : 'E-mail ou senha incorretos',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    toast({
      title: isGerman ? 'Willkommen!' : 'Bem-vindo!',
      description: isGerman
        ? 'Weiterleitung zum Dashboard...'
        : 'Redirecionando para o dashboard...',
    });

    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* LEFT SIDE */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-emerald-700 to-teal-600 text-white relative">
        {/* LANGUAGE SWITCHER */}
        <div className="absolute top-6 right-6">
          <LanguageSwitcher />
        </div>

        {/* HEADER */}
        <div className="flex flex-col gap-6">
          {/* LOGO */}
          <img
            src="/greendot-logo.png"
            alt="greenDOT.it"
            className="max-w-[220px] h-auto object-contain"
          />

          {/* PRODUCT */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <Radar className="h-7 w-7" />
            </div>
            <span className="text-2xl font-bold tracking-tight">
              KampagnenRadar
            </span>
          </div>
        </div>

        {/* TEXT */}
        <div className="space-y-4 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            {isGerman
              ? 'Verstehen Sie Ihre Kampagnen auf einen Blick'
              : 'Entenda suas campanhas em um relance'}
          </h1>
          <p className="text-white/80 text-lg">
            {isGerman
              ? 'KI-gestützte Analyse für Google Ads und GA4.'
              : 'Análise impulsionada por IA para Google Ads e GA4.'}
          </p>
        </div>

        <div className="text-sm text-white/60">
          Google Ads · GA4 · AI Insights
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center justify-center p-6 relative">
        {/* MOBILE LANGUAGE */}
        <div className="absolute top-4 right-4 lg:hidden">
          <LanguageSwitcher />
        </div>

        <div className="w-full max-w-md space-y-8">
          {/* MOBILE HEADER */}
          <div className="lg:hidden flex flex-col items-center gap-4">
            <img
              src="/greendot-logo.png"
              alt="greenDOT.it"
              className="max-w-[180px] h-auto object-contain"
            />
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Radar className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold">
                KampagnenRadar
              </span>
            </div>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-semibold">
              {isGerman ? 'Anmelden' : 'Entrar'}
            </h2>
            <p className="text-muted-foreground">
              {isGerman
                ? 'Melden Sie sich an, um das Dashboard zu sehen.'
                : 'Faça login para acessar o dashboard.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@email.com"
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 btn-primary-gradient"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isGerman ? (
                'Anmelden'
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
