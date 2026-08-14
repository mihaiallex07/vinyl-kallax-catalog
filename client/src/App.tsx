/* Hi-Fi Afterglow: shared shell with a quiet route split between catalog and KALLAX visualization. */
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import KallaxPage from "./pages/KallaxPage";
import { Route, Router, Switch } from "wouter";

export default function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return <ErrorBoundary><TooltipProvider><Router base={base}><Switch><Route path="/" component={Home} /><Route path="/kallax" component={KallaxPage} /></Switch></Router></TooltipProvider></ErrorBoundary>;
}
