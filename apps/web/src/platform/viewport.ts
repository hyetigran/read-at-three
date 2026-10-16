export function isTeachingViewport(): boolean {
  return (
    window.innerWidth >= 900 &&
    window.innerHeight >= 600 &&
    window.innerWidth > window.innerHeight
  );
}

export function subscribeViewport(listener: () => void): () => void {
  window.addEventListener("resize", listener);
  window.addEventListener("orientationchange", listener);
  return () => {
    window.removeEventListener("resize", listener);
    window.removeEventListener("orientationchange", listener);
  };
}
