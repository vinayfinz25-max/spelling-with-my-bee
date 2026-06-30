import { type ComponentPropsWithoutRef, type ReactNode } from "react";
import { Link } from "react-router";

type PrimaryButtonProps = {
  children: ReactNode;
  to?: string;
} & ComponentPropsWithoutRef<"button">;

export function PrimaryButton({
  children,
  className = "",
  to,
  type = "button",
  ...buttonProps
}: PrimaryButtonProps) {
  const baseClassName = [
    "inline-flex min-h-11 items-center justify-center rounded-lg bg-primary-yellow px-5 py-3 text-sm font-bold text-primary-text shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-blue-accent focus:ring-offset-2",
    className
  ].join(" ");

  if (to !== undefined) {
    return (
      <Link className={baseClassName} to={to}>
        {children}
      </Link>
    );
  }

  return (
    <button className={baseClassName} type={type} {...buttonProps}>
      {children}
    </button>
  );
}
