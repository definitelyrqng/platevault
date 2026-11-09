/** Re-mounts on every navigation: a soft fade-in so page swaps don't "pop". */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-in">{children}</div>;
}
