import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";

export function AppShell({
  children,
  back,
  title,
  action,
}: {
  children: React.ReactNode;
  back?: string;
  title?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto max-w-md flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2 min-w-0">
            {back ? (
              <Button asChild variant="ghost" size="icon" className="-ml-2">
                <Link to={back}>
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
            ) : null}
            {title ? (
              <h1 className="font-semibold text-foreground truncate">{title}</h1>
            ) : (
              <Logo size={32} />
            )}
          </div>
          {action}
        </div>
      </header>
      <main className="mx-auto max-w-md px-4 pb-24 pt-4">{children}</main>
    </div>
  );
}
