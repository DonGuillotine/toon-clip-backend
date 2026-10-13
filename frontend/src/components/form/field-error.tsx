/**
 * A field's validation message, announced when it appears. Renders nothing
 * when the field is fine, so the layout does not reserve a blank line.
 */
export function FieldError({ message }: { readonly message: string | undefined }) {
  if (message === undefined) return null;
  return (
    <p role="alert" className="text-xs text-destructive-foreground">
      {message}
    </p>
  );
}
