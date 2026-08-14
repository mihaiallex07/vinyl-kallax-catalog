/* Hi-Fi Afterglow: shared shell with a deterministic GitHub Pages-safe route split. */
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import KallaxPage from "./pages/KallaxPage";

export default function App() {
  const isKallax = window.location.pathname.endsWith("/kallax");
  return <ErrorBoundary><TooltipProvider>{isKallax ? <KallaxPage /> : <Home />}</TooltipProvider></ErrorBoundary>;
}
