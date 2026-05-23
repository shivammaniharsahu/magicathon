"use client";

import * as React from "react";

export function useIntersection<T extends Element>(
  options: IntersectionObserverInit = { rootMargin: "200px" },
) {
  const ref = React.useRef<T | null>(null);
  const [isIntersecting, setIntersecting] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      setIntersecting(Boolean(entry?.isIntersecting));
    }, options);
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.root, options.rootMargin, options.threshold]);

  return { ref, isIntersecting };
}
