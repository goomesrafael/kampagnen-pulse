import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Radar, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { toast } from '@/hooks/use-toast';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate authentication
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: isSignUp ? 'Account created!' : 'Welcome back!',
      description: 'Redirecting to dashboard...',
    });

    setTimeout(() => {
      navigate('/dashboard');
    }, 500);

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-primary-light" />
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Radar className="h-7 w-7" />
            </div>
            <span className="text-2xl font-bold tracking-tight">KampagnenRadar</span>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight">
              {t('common.language') === 'Sprache' 
                ? 'Verstehen Sie Ihre Kampagnen auf einen Blick'
                : 'Entenda suas campanhas em um relance'}
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-md">
              {t('common.language') === 'Sprache'
                ? 'KI-gestützte Analyse für Google Ads und GA4. Tägliche Einblicke, automatische Warnungen und Optimierungsvorschläge.'
                : 'Análise impulsionada por IA para Google Ads e GA4. Insights diários, alertas automáticos e sugestões de otimização.'}
            </p>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-primary-foreground/70">
            <span>Google Ads</span>
            <span className="h-1 w-1 rounded-full bg-primary-foreground/40" />
            <span>GA4</span>
            <span className="h-1 w-1 rounded-full bg-primary-foreground/40" />
            <span>AI Insights</span>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col">
        <header className="flex justify-end p-6">
          <LanguageSwitcher />
        </header>

        <main className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm space-y-8">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Radar className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold tracking-tight">KampagnenRadar</span>
            </div>

            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-2xl font-semibold tracking-tight">
                {isSignUp ? t('login.createAccount') : t('login.title')}
              </h2>
              <p className="text-muted-foreground">
                {t('login.subtitle')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">{t('login.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('login.password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {!isSignUp && (
                <div className="flex justify-end">
                  <button type="button" className="text-sm text-primary hover:underline">
                    {t('login.forgotPassword')}
                  </button>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 btn-primary-gradient"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  isSignUp ? t('login.createAccount') : t('login.signIn')
                )}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                {isSignUp ? t('login.noAccount').replace('Noch kein Konto?', 'Bereits ein Konto?').replace('Não tem uma conta?', 'Já tem uma conta?') : t('login.noAccount')}
              </span>{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary font-medium hover:underline"
              >
                {isSignUp ? t('login.signIn') : t('login.createAccount')}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
