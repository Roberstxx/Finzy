import { Wifi, Film, Wrench, User, ShoppingCart, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  wifi: Wifi,
  movie: Film,
  build: Wrench,
  person: User,
  shopping_cart: ShoppingCart,
};

const colorMap: Record<string, string> = {
  cat_services: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  cat_entertainment: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  cat_tools: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  cat_personal: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  cat_products: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
};

interface Props {
  icon: string;
  categoryId?: string;
  size?: number;
  className?: string;
}

const CategoryIcon = ({ icon, categoryId, size = 20, className }: Props) => {
  const Icon = iconMap[icon] || HelpCircle;
  const colors = categoryId ? colorMap[categoryId] || 'bg-muted text-muted-foreground' : 'bg-muted text-muted-foreground';

  return (
    <div className={cn('flex items-center justify-center w-10 h-10 rounded-xl', colors, className)}>
      <Icon size={size} />
    </div>
  );
};

export default CategoryIcon;
