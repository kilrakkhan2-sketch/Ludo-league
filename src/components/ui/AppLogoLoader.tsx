
import { AppLogo } from '@/components/icons/AppLogo';
import { cn } from '@/lib/utils';

interface AppLogoLoaderProps {
  className?: string;
}

export function AppLogoLoader({ className }: AppLogoLoaderProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <AppLogo className="h-12 w-12 animate-pulse text-primary" />
    </div>
  );
}
