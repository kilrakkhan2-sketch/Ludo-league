
import { AppLogoLoader } from './AppLogoLoader';

export function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <AppLogoLoader />
    </div>
  );
}
