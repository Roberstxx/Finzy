import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import CategoryIcon from '@/components/CategoryIcon';
import { toast } from 'sonner';
import PageShell from '@/components/layout/PageShell';

interface CategoriesLocationState {
  openCreate?: boolean;
  returnTo?: string;
}

const CategoriesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, loading, addCategory, deleteCategory } = useApp();
  const initialRouteState = (location.state as CategoriesLocationState | null) ?? null;
  const [returnTo] = useState(initialRouteState?.returnTo ?? null);
  const [forceCreateFlow, setForceCreateFlow] = useState(Boolean(initialRouteState?.openCreate));
  const shouldOpenEditor = state.categories.length === 0 || forceCreateFlow;
  const [showAdd, setShowAdd] = useState(shouldOpenEditor);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('wifi');
  const [saving, setSaving] = useState(false);
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const iconOptions = ['wifi', 'movie', 'build', 'person', 'shopping_cart'];

  useEffect(() => {
    if (shouldOpenEditor) {
      setShowAdd(true);
    }
  }, [shouldOpenEditor]);

  useEffect(() => {
    if (location.state) {
      navigate(location.pathname, { replace: true });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!pendingCategoryId) return;

    const categorySaved = state.categories.some(category => category.id === pendingCategoryId);
    if (!categorySaved) return;

    setPendingCategoryId(null);
    setSaving(false);
    setNewName('');
    setNewIcon('wifi');
    setShowAdd(false);
    setForceCreateFlow(false);

    if (returnTo) {
      toast.success('Categoria creada. Ya puedes continuar con tu pago.');
      navigate(returnTo, { replace: true });
      return;
    }

    toast.success('Categoria guardada correctamente');
  }, [navigate, pendingCategoryId, returnTo, state.categories]);

  const handleAdd = async () => {
    const trimmedName = newName.trim();
    if (!trimmedName || saving) return;

    setSaving(true);

    try {
      const highestOrder = state.categories.reduce((currentMax, category) => Math.max(currentMax, category.order ?? 0), 0);
      const { categoryId, commit } = addCategory({
        name: trimmedName,
        icon: newIcon,
        order: highestOrder + 1,
      });
      setPendingCategoryId(categoryId);

      void commit.catch(error => {
        const message = error instanceof Error ? error.message : 'No se pudo guardar la categoria.';

        if (isMountedRef.current) {
          setPendingCategoryId(current => current === categoryId ? null : current);
          setSaving(false);
        }

        toast.error(message);
      });
    } catch (error) {
      setSaving(false);
      const message = error instanceof Error ? error.message : 'No se pudo guardar la categoria.';
      toast.error(message);
    }
  };

  const handleCloseEditor = () => {
    if (state.categories.length === 0) {
      if (returnTo) {
        navigate(returnTo);
        return;
      }

      navigate(-1);
      return;
    }

    setForceCreateFlow(false);
    setShowAdd(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      toast.success('Categoria eliminada');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar la categoria.';
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <PageShell className="mx-auto max-w-[1180px]">
        <div className="page-surface flex min-h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Preparando tus datos...</p>
              <p className="text-sm text-muted-foreground">Sincronizando tus categorias.</p>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="mx-auto max-w-[1180px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-card/80 text-foreground transition-colors hover:bg-card"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="page-section-label">Catalogo</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">Categorias</h1>
          </div>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="hidden items-center justify-center gap-2 rounded-[22px] bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-all hover:translate-y-[-1px] md:inline-flex"
        >
          <Plus size={18} />
          Nueva categoria
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="page-surface overflow-hidden">
          <div className="border-b border-border/60 px-6 py-4">
            <p className="page-section-label">Listado</p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">Categorias activas</h2>
          </div>

          {state.categories.length > 0 ? (
            <div className="divide-y divide-border/60">
              {state.categories.map(category => (
                <div key={category.id} className="flex items-center gap-4 px-6 py-4">
                  <CategoryIcon icon={category.icon} categoryId={category.id} className="h-12 w-12 rounded-2xl" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-card-foreground">{category.name}</p>
                    <p className="text-sm text-muted-foreground">Orden {category.order || '--'}</p>
                  </div>
                  <button
                    onClick={() => void handleDelete(category.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No tienes categorias todavia. El editor ya esta abierto para que crees la primera sin salir de aqui.
            </div>
          )}
        </section>

        <aside className={`page-surface p-6 ${showAdd ? '' : 'hidden lg:block'}`}>
          <p className="page-section-label">Editor</p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">Nueva categoria</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {returnTo
              ? 'Crea la primera categoria y te regresamos al formulario del pago para seguir.'
              : 'Organiza mejor tus pagos creando categorias claras y faciles de identificar.'}
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Nombre</label>
              <input
                value={newName}
                onChange={event => setNewName(event.target.value)}
                placeholder="Nombre de la categoria"
                className="w-full rounded-2xl border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Icono</label>
              <div className="grid grid-cols-5 gap-2">
                {iconOptions.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setNewIcon(icon)}
                    className={`rounded-2xl p-2 transition-colors ${newIcon === icon ? 'bg-primary text-primary-foreground' : 'bg-background/80 text-muted-foreground hover:text-foreground'}`}
                  >
                    <CategoryIcon icon={icon} size={16} className="h-10 w-10 rounded-2xl" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleCloseEditor}
                disabled={saving}
                className="flex-1 rounded-[22px] bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                {state.categories.length === 0 ? 'Volver' : 'Cancelar'}
              </button>
              <button
                onClick={() => void handleAdd()}
                disabled={saving || !newName.trim()}
                className="flex-1 rounded-[22px] bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Agregar'}
              </button>
            </div>
          </div>
        </aside>
      </div>

      <button
        onClick={() => setShowAdd(true)}
        className={`fixed bottom-24 right-6 z-40 h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-95 md:hidden ${showAdd ? 'hidden' : 'flex'}`}
      >
        <Plus size={28} />
      </button>
    </PageShell>
  );
};

export default CategoriesPage;
