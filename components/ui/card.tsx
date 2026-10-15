import type { HTMLAttributes, ReactNode } from "react";

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card ${className ?? ""}`} {...props}>
      {children}
    </div>
  );
}

type CardHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5 ${className ?? ""}`}
    >
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-4 py-4 sm:px-5 ${className ?? ""}`} {...props}>
      {children}
    </div>
  );
}
