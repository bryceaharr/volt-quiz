export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass rounded-3xl px-8 py-16 text-center flex flex-col items-center gap-4">
      <div className="size-16 rounded-2xl bg-primary/15 flex items-center justify-center">
        {icon}
      </div>
      <div className="space-y-1.5 max-w-md">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
