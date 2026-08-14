/* Hi-Fi Afterglow: the app shell keeps the catalog focused, warm, and editorial. */
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";

export default function App() {
  return <ErrorBoundary><TooltipProvider><Home /></TooltipProvider></ErrorBoundary>;
}
