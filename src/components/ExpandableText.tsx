"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  collapsedLines?: number;
};

export function ExpandableText({ text, collapsedLines = 5 }: Props) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      if (expanded) return;
      setCanExpand(el.scrollHeight > el.clientHeight + 1);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, expanded, collapsedLines]);

  return (
    <div>
      <p
        ref={ref}
        className={`whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground ${
          expanded ? "" : "overflow-hidden"
        }`}
        style={
          expanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: collapsedLines,
              }
        }
      >
        {text}
      </p>
      {canExpand || expanded ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-sm font-semibold text-primary"
        >
          {expanded ? "Ver menos" : "Ver más"}
        </button>
      ) : null}
    </div>
  );
}
