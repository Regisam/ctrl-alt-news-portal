export function RouteLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="space-y-4 text-center">
        <div className="inline-flex h-12 w-12 animate-spin items-center justify-center rounded-full border-4 border-muted border-t-primary">
        </div>
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}
