import { Link } from "@tanstack/react-router";
import { ArrowLeft, Menu, Home, FileText, Receipt } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";

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
        <div className="mx-auto max-w-md flex h-14 items-center justify-between px-4 gap-2">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {back ? (
              <Button asChild variant="ghost" size="icon" className="-ml-2 shrink-0">
                <Link to={back}>
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="-ml-2 shrink-0">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Logo size={28} />
                      <span>Orça Fácil</span>
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="mt-6 space-y-1">
                    <SheetClose asChild>
                      <Link
                        to="/"
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-accent transition"
                      >
                        <Home className="h-5 w-5 text-primary" />
                        Início
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        to="/modelos"
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-accent transition"
                      >
                        <FileText className="h-5 w-5 text-primary" />
                        Meus modelos
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        to="/orcamentos"
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-accent transition"
                      >
                        <Receipt className="h-5 w-5 text-primary" />
                        Meus orçamentos
                      </Link>
                    </SheetClose>
                  </nav>
                  <p className="mt-8 text-[11px] text-muted-foreground px-3">
                    Crie, salve e gere PDFs profissionais em segundos.
                  </p>
                </SheetContent>
              </Sheet>
            )}
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
