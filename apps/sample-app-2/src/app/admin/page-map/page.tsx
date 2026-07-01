const nodes = [
  { slug: 'home', label: 'Home', kind: 'Hub', x: 8, y: 42 },
  { slug: 'features', label: 'Features', kind: 'Spoke', x: 42, y: 18 },
  { slug: 'contact', label: 'Contact', kind: 'Spoke', x: 42, y: 66 },
  { slug: 'blog', label: 'Blog', kind: 'Orphan', x: 74, y: 42 },
];

export default function AdminPageMapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-neutral-950">Page Map</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-600">
          The existing admin uses ReactFlow with Dagre auto-layout, persisted `layoutPositions`, hub/spoke edges, related-hub dashed edges, and orphan detection. This route is reserved for the same infrastructure inside tenant instances.
        </p>
      </div>

      <section className="relative h-[34rem] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <svg className="absolute inset-0 h-full w-full" role="img" aria-label="Sample page map">
          <defs>
            <marker id="arrow" markerHeight="8" markerWidth="8" orient="auto" refX="5" refY="3">
              <path d="M0,0 L0,6 L6,3 z" fill="#f97316" />
            </marker>
          </defs>
          <line x1="18%" y1="47%" x2="42%" y2="24%" stroke="#f97316" strokeWidth="2" markerEnd="url(#arrow)" />
          <line x1="18%" y1="47%" x2="42%" y2="69%" stroke="#f97316" strokeWidth="2" markerEnd="url(#arrow)" />
          <line x1="52%" y1="24%" x2="74%" y2="44%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 5" />
        </svg>
        {nodes.map((node) => (
          <div
            key={node.slug}
            className={`absolute w-40 -translate-x-1/2 -translate-y-1/2 rounded-lg border px-4 py-3 text-center shadow-sm ${
              node.kind === 'Hub'
                ? 'border-orange-400 bg-orange-50'
                : node.kind === 'Orphan'
                  ? 'border-dashed border-amber-400 bg-amber-50'
                  : 'border-neutral-200 bg-white'
            }`}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <p className="truncate text-sm font-black text-neutral-950">{node.label}</p>
            <p className="mt-1 text-xs font-bold uppercase text-neutral-500">{node.kind}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
