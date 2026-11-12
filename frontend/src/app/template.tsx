/**
 * Re-mounts on every navigation, so each new page fades in over 180ms (opacity only, no travel).
 * Reduced motion turns it off through the global rule in globals.css.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page">{children}</div>;
}
