import logo from "@/assets/logo.png";

export function Logo({ size = 40, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <img src={logo} alt="Orça Fácil" width={size} height={size} className="rounded-xl" />
      {withText && (
        <div className="flex flex-col leading-none">
          <span className="font-bold text-foreground text-lg tracking-tight">Orça Fácil</span>
          <span className="text-[10px] text-muted-foreground tracking-wider uppercase">Orçamentos rápidos</span>
        </div>
      )}
    </div>
  );
}
