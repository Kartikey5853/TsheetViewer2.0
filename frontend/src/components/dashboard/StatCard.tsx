interface StatCardProps {
  title: string;
  value: string;
  tone?: "default" | "primary";
}

export default function StatCard({ title, value, tone = "default" }: StatCardProps) {
  const toneClass = tone === "primary" ? "from-primary/20 to-accent" : "from-card to-muted/60";

  return (
    <article className={`rounded-2xl border border-border bg-gradient-to-br ${toneClass} p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md`}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </article>
  );
}
