import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AuthShell from '@/components/layout/AuthShell';

const LoginPage = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !password) {
      toast({ title: 'Campos requeridos', description: 'Ingresa tu email y contrasena', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      const errorCode = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
      const message = errorCode === 'auth/invalid-credential'
        ? 'Email o contrasena incorrectos'
        : errorCode === 'auth/too-many-requests'
          ? 'Demasiados intentos, intenta mas tarde'
          : 'Error al iniciar sesion';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
      navigate('/');
    } catch {
      toast({ title: 'Error', description: 'No se pudo iniciar con Google', variant: 'destructive' });
    }
  };

  return (
    <AuthShell
      title="Inicia sesion"
      subtitle="Entra a tu panel y continua administrando pagos con una interfaz renovada para web."
      footer={
        <p className="text-center text-sm text-muted-foreground xl:text-left">
          No tienes cuenta?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Registrate
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="h-12 rounded-2xl border-border/70 bg-background/80 pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contrasena</Label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Ingresa tu contrasena"
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="h-12 rounded-2xl border-border/70 bg-background/80 pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(current => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <Button type="submit" className="h-12 w-full rounded-2xl text-base font-semibold" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">o continua con</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button variant="outline" className="h-12 w-full rounded-2xl font-medium" onClick={handleGoogle}>
        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continuar con Google
      </Button>
    </AuthShell>
  );
};

export default LoginPage;
