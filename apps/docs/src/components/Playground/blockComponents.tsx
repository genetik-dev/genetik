import type { BlockProps } from "@genetik/renderer-react";

export function TextBlock({ config }: BlockProps) {
  const content = (config as { content?: string }).content ?? "";
  return <span>{content}</span>;
}

export function CardBlock({ config, slots }: BlockProps) {
  const title = (config as { title?: string }).title ?? "";
  return (
    <div className="playground-card">
      {title ? <div className="playground-card__title">{title}</div> : null}
      <div className="playground-card__children">{slots.children ?? []}</div>
    </div>
  );
}
