import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AuthShell from '@/components/layout/AuthShell';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name || !email || !password) {
      toast({ title: 'Campos requeridos', description: 'Completa todos los campos', variant: 'destructive' });
      return;
    }

    if (password.length < 6) {
      toast({ title: 'Contrasena debil', description: 'Minimo 6 caracteres', variant: 'destructive' });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Las contrasenas no coinciden', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await register(email, password, name);
      toast({ title: 'Bienvenido', description: 'Tu cuenta fue creada correctamente' });
      navigate('/');
    } catch (error) {
      const errorCode = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
      const message = errorCode === 'auth/email-already-in-use'
        ? 'Ese email ya esta registrado'
        : errorCode === 'auth/weak-password'
          ? 'La contrasena es muy debil'
          : 'Error al crear la cuenta';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="Empieza con una base visual mas pulida y deja listo tu espacio para organizar pagos desde web."
      footer={
        <p className="text-center text-sm text-muted-foreground xl:text-left">
          Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Inicia sesion
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={event => setName(event.target.value)}
              className="h-12 rounded-2xl border-border/70 bg-background/80 pl-10"
            />
          </div>
        </div>

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
              placeholder="Minimo 6 caracteres"
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar contrasena</Label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repite tu contrasena"
              value={confirmPassword}
              onChange={event => setConfirmPassword(event.target.value)}
              className="h-12 rounded-2xl border-border/70 bg-background/80 pl-10"
            />
          </div>
        </div>

        <Button type="submit" className="h-12 w-full rounded-2xl text-base font-semibold" disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </Button>
      </form>
    </AuthShell>
  );
};

export default RegisterPage;
