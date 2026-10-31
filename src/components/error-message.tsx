import { dangerText } from "@/lib/styles";

export function ErrorMessage({
  message,
  className = "",
}: {
  message: string | null;
  className?: string;
}) {
  if (!message) return null;
  return (
    <p role="alert" className={`${dangerText} ${className}`}>
      {message}
    </p>
  );
}
