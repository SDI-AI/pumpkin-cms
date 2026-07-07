'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Dagre from '@dagrejs/dagre';
import { GitBranch, Plus, RotateCcw, Search } from 'lucide-react';
import type { NodePosition, Page } from 'pumpkin-ts-models';

interface PageFlowMapViewProps {
  pages: Page[];
  unavailablePages: string[];
}

const HUB_WIDTH = 180;
const HUB_HEIGHT = 60;
const SPOKE_WIDTH = 160;
const SPOKE_HEIGHT = 48;
const ORPHAN_WIDTH = 160;
const ORPHAN_HEIGHT = 52;

export function PageFlowMapView({ pages, unavailablePages }: PageFlowMapViewProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [savingLayout, setSavingLayout] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredPages = useMemo(() => filterPages(pages, query), [pages, query]);
  const stats = useMemo(() => getStats(filteredPages), [filteredPages]);

  const handleAddSpoke = useCallback((hubSlug: string) => {
    router.push(`/admin/pages/new?hubPageSlug=${encodeURIComponent(hubSlug)}`);
  }, [router]);

  const handleEditPage = useCallback((pageSlug: string) => {
    router.push(`/admin/pages/${encodeSlugPath(pageSlug)}`);
  }, [router]);

  const saveLayoutPositions = useCallback(async (currentNodes: Node[]) => {
    if (currentNodes.length === 0 || pages.length === 0) return;

    setSavingLayout(true);
    setMessage('');
    setError('');

    try {
      const positions: Record<string, NodePosition> = {};
      currentNodes.forEach((node) => {
        positions[node.id] = {
          x: node.position.x,
          y: node.position.y,
        };
      });

      await Promise.all(
        pages.map((page) => {
          const updatedPage: Page = {
            ...page,
            layoutPositions: positions,
            MetaData: {
              ...page.MetaData,
              updatedAt: new Date().toISOString(),
            },
          };

          return fetch(`/api/admin/pages/${encodeSlugPath(page.pageSlug)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedPage),
          }).then(async (response) => {
            if (!response.ok) {
              throw new Error(await getErrorMessage(response));
            }
          });
        }),
      );

      setMessage('Layout saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save layout.');
    } finally {
      setSavingLayout(false);
    }
  }, [pages]);

  const resetLayout = useCallback(() => {
    const graph = buildFlowGraph(filteredPages, handleAddSpoke);
    const layoutNodes = applyDagreLayout(graph.nodes, graph.edges);
    setNodes(layoutNodes);
    setEdges(graph.edges);
    saveLayoutPositions(layoutNodes);
  }, [filteredPages, handleAddSpoke, saveLayoutPositions, setEdges, setNodes]);

  const handleNodeDragStop = useCallback((_event: MouseEvent | TouchEvent, draggedNode: Node) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const nextNodes = nodes.map((node) => (
      node.id === draggedNode.id ? { ...node, position: draggedNode.position } : node
    ));

    saveTimeoutRef.current = setTimeout(() => {
      saveLayoutPositions(nextNodes);
    }, 500);
  }, [nodes, saveLayoutPositions]);

  useEffect(() => {
    const graph = buildFlowGraph(filteredPages, handleAddSpoke);
    const savedLayout = pages.find((page) => (
      page.layoutPositions && Object.keys(page.layoutPositions).length > 0
    ))?.layoutPositions;

    const finalNodes = savedLayout
      ? graph.nodes.map((node) => ({
          ...node,
          position: savedLayout[node.id] ?? node.position,
        }))
      : applyDagreLayout(graph.nodes, graph.edges);

    setNodes(finalNodes);
    setEdges(graph.edges);
  }, [filteredPages, handleAddSpoke, pages, setEdges, setNodes]);

  useEffect(() => () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-neutral-200 bg-white px-4 py-3 shadow-sm sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-pumpkin-50 text-pumpkin-700">
              <GitBranch className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-pumpkin-700">Page Map</p>
              <h1 className="truncate text-lg font-bold text-neutral-950">Tenant Page Hierarchy</h1>
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="grid grid-cols-4 gap-2">
              <Stat label="Pages" value={String(filteredPages.length)} />
              <Stat label="Hubs" value={String(stats.hubCount)} />
              <Stat label="Spokes" value={String(stats.spokeCount)} />
              <Stat label="Orphans" value={String(stats.orphanedCount)} />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter pages"
                  className="h-10 w-full rounded-md border border-neutral-300 px-3 pl-9 text-sm outline-none focus:border-pumpkin-500 focus:ring-2 focus:ring-pumpkin-100"
                />
              </div>

              <button
                type="button"
                onClick={resetLayout}
                disabled={savingLayout || nodes.length === 0}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>{savingLayout ? 'Saving...' : 'Reset Layout'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <LegendItem color="linear-gradient(135deg,#fff7ed,#ffedd5)" border="2px solid #f97316" label="Hub" value={String(stats.hubCount)} />
            <LegendItem color="#fff" border="1.5px solid #d1d5db" label="Spoke" value={String(stats.spokeCount)} />
            <LegendItem color="linear-gradient(135deg,#fffbeb,#fef3c7)" border="2px dashed #f59e0b" label="Orphaned" value={String(stats.orphanedCount)} />
            <EdgeLegend color="#f97316" label="Hub to Spoke" />
            <EdgeLegend color="#dc2626" label="Hub to Sub-Hub" width={3} />
            <EdgeLegend color="#3b82f6" label="Related Hubs" dashed />
          </div>

          <div className="min-h-8">
            {unavailablePages.length > 0 && (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-800">
                Some sitemap entries could not be loaded: {unavailablePages.join(', ')}
              </p>
            )}
            {(message || error) && (
              <p className={[
                'rounded-md border px-3 py-1.5 text-sm',
                error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700',
              ].join(' ')}>
                {error || message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden bg-neutral-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={handleNodeDragStop}
          onNodeDoubleClick={(_event, node) => handleEditPage(node.id)}
          fitView
          fitViewOptions={{ padding: 0.15, maxZoom: 1.2 }}
          minZoom={0.1}
          maxZoom={2}
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Lines} color="#e5e5e5" gap={24} />
          <Controls
            showInteractive={false}
            position="bottom-right"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              borderRadius: 10,
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            }}
          />
          {nodes.length > 0 && (
            <MiniMap
              position="bottom-left"
              nodeColor={(node) => {
                const border = String(node.style?.border || '');
                if (border.includes('#f97316')) return '#f97316';
                if (border.includes('#f59e0b')) return '#f59e0b';
                return '#d1d5db';
              }}
              maskColor="rgba(0, 0, 0, 0.08)"
              style={{
                width: 176,
                height: 112,
                borderRadius: 8,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              }}
              pannable
              zoomable
            />
          )}

          {nodes.length === 0 && (
            <Panel position="top-center">
              <div className="mt-32 rounded-lg border border-neutral-200 bg-white/90 px-10 py-8 text-center shadow-lg backdrop-blur-sm">
                <h3 className="text-base font-bold text-neutral-950">No Pages Found</h3>
                <p className="mt-2 text-sm text-neutral-500">
                  Published sitemap pages will appear here once content is available for this tenant.
                </p>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
}

function buildFlowGraph(pages: Page[], onAddSpoke: (hubSlug: string) => void): { nodes: Node[]; edges: Edge[] } {
  const flowNodes: Node[] = [];
  const flowEdges: Edge[] = [];
  const renderedPageIds = new Set<string>();
  const pageBySlug = new Map<string, Page>();

  pages.forEach((page) => {
    if (page.pageSlug) pageBySlug.set(page.pageSlug, page);
  });

  const hubs = pages.filter((page) => page.contentRelationships?.isHub);

  hubs.forEach((hub) => {
    renderedPageIds.add(hub.pageSlug);
    flowNodes.push(createHubNode(hub, onAddSpoke));

    pages
      .filter((page) => page.contentRelationships?.hubPageSlug === hub.pageSlug && !page.contentRelationships?.isHub)
      .forEach((spoke) => {
        renderedPageIds.add(spoke.pageSlug);
        flowNodes.push(createSpokeNode(spoke));
        flowEdges.push({
          id: `hub-spoke-${hub.pageSlug}-${spoke.pageSlug}`,
          source: hub.pageSlug,
          target: spoke.pageSlug,
          type: 'default',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#f97316', width: 16, height: 16 },
          style: { stroke: '#f97316', strokeWidth: 2 },
        });
      });
  });

  hubs.forEach((hub) => {
    pages
      .filter((page) => page.contentRelationships?.hubPageSlug === hub.pageSlug && page.contentRelationships?.isHub)
      .forEach((childHub) => {
        if (!renderedPageIds.has(childHub.pageSlug)) return;
        flowEdges.push({
          id: `hub-hub-${hub.pageSlug}-${childHub.pageSlug}`,
          source: hub.pageSlug,
          target: childHub.pageSlug,
          type: 'default',
          animated: true,
          label: 'sub-hub',
          labelStyle: { fontSize: 9, fill: '#dc2626', fontWeight: 600 },
          labelBgStyle: { fill: '#fef2f2', fillOpacity: 0.95 },
          labelBgPadding: [4, 2] as [number, number],
          labelBgBorderRadius: 4,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#dc2626', width: 18, height: 18 },
          style: { stroke: '#dc2626', strokeWidth: 3 },
        });
      });
  });

  const addedRelatedEdges = new Set<string>();
  hubs.forEach((hub) => {
    (hub.contentRelationships?.relatedHubs || []).forEach((slug) => {
      const related = pageBySlug.get(slug);
      if (!related || !renderedPageIds.has(related.pageSlug)) return;

      const key = [hub.pageSlug, related.pageSlug].sort().join('|');
      if (addedRelatedEdges.has(key)) return;

      addedRelatedEdges.add(key);
      flowEdges.push({
        id: `related-${key}`,
        source: hub.pageSlug,
        target: related.pageSlug,
        type: 'default',
        animated: false,
        label: 'related',
        labelStyle: { fontSize: 9, fill: '#3b82f6', fontWeight: 500 },
        labelBgStyle: { fill: '#eff6ff', fillOpacity: 0.9 },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6', width: 14, height: 14 },
        style: { stroke: '#3b82f6', strokeWidth: 1.5, strokeDasharray: '8 4' },
      });
    });
  });

  pages
    .filter((page) => !renderedPageIds.has(page.pageSlug))
    .forEach((orphan) => flowNodes.push(createOrphanNode(orphan)));

  return { nodes: flowNodes, edges: flowEdges };
}

function createHubNode(hub: Page, onAddSpoke: (hubSlug: string) => void): Node {
  return {
    id: hub.pageSlug,
    type: 'default',
    position: { x: 0, y: 0 },
    width: HUB_WIDTH,
    height: HUB_HEIGHT,
    data: {
      label: (
        <div className="text-center">
          <div className="truncate text-xs font-semibold leading-snug text-pumpkin-700" style={{ maxWidth: HUB_WIDTH - 24 }}>
            {hub.MetaData?.title || hub.pageSlug}
          </div>
          <div className="mt-0.5 flex items-center justify-center gap-1.5">
            <span className="text-[9px] uppercase tracking-wide text-pumpkin-800">Hub</span>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onAddSpoke(hub.pageSlug);
              }}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-pumpkin-500 text-white transition-transform hover:scale-110"
              title="Add spoke page"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
          {hub.contentRelationships?.topicCluster && (
            <div className="mt-0.5 truncate text-[9px] text-pumpkin-600" style={{ maxWidth: HUB_WIDTH - 24 }}>
              {hub.contentRelationships.topicCluster}
            </div>
          )}
          {!hub.isPublished && <div className="mt-0.5 text-[9px] italic text-amber-600">Draft</div>}
        </div>
      ),
    },
    style: {
      background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
      border: '2px solid #f97316',
      borderRadius: '10px',
      padding: '8px 10px',
      width: HUB_WIDTH,
      boxShadow: '0 3px 8px rgba(249, 115, 22, 0.12)',
    },
  };
}

function createSpokeNode(spoke: Page): Node {
  return {
    id: spoke.pageSlug,
    type: 'default',
    position: { x: 0, y: 0 },
    width: SPOKE_WIDTH,
    height: SPOKE_HEIGHT,
    data: {
      label: (
        <div className="text-center">
          <div className="truncate text-xs font-medium leading-snug text-neutral-800" style={{ maxWidth: SPOKE_WIDTH - 24 }}>
            {spoke.MetaData?.title || spoke.pageSlug}
          </div>
          {spoke.contentRelationships?.topicCluster && (
            <div className="mt-0.5 truncate text-[9px] text-blue-600" style={{ maxWidth: SPOKE_WIDTH - 24 }}>
              {spoke.contentRelationships.topicCluster}
            </div>
          )}
          {!spoke.isPublished && <div className="mt-0.5 text-[9px] italic text-amber-600">Draft</div>}
        </div>
      ),
    },
    style: {
      background: '#ffffff',
      border: '1.5px solid #d1d5db',
      borderRadius: '8px',
      padding: '6px 10px',
      width: SPOKE_WIDTH,
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
  };
}

function createOrphanNode(orphan: Page): Node {
  return {
    id: orphan.pageSlug,
    type: 'default',
    position: { x: 0, y: 0 },
    width: ORPHAN_WIDTH,
    height: ORPHAN_HEIGHT,
    data: {
      label: (
        <div className="text-center">
          <div className="truncate text-xs font-medium leading-snug text-amber-800" style={{ maxWidth: ORPHAN_WIDTH - 24 }}>
            {orphan.MetaData?.title || orphan.pageSlug}
          </div>
          <div className="mt-0.5 text-[9px] uppercase tracking-wide text-amber-700">Orphaned</div>
          {orphan.contentRelationships?.hubPageSlug && (
            <div className="mt-0.5 truncate text-[9px] text-red-600" style={{ maxWidth: ORPHAN_WIDTH - 24 }}>
              Missing hub: {orphan.contentRelationships.hubPageSlug}
            </div>
          )}
          {!orphan.isPublished && <div className="mt-0.5 text-[9px] italic text-amber-600">Draft</div>}
        </div>
      ),
    },
    style: {
      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      border: '2px dashed #f59e0b',
      borderRadius: '8px',
      padding: '6px 10px',
      width: ORPHAN_WIDTH,
      boxShadow: '0 2px 4px rgba(245, 158, 11, 0.10)',
    },
  };
}

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const graph = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 180, marginx: 40, marginy: 40 });

  nodes.forEach((node) => {
    const width = (node.measured?.width ?? node.width ?? 200) as number;
    const height = (node.measured?.height ?? node.height ?? 70) as number;
    graph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => graph.setEdge(edge.source, edge.target));
  Dagre.layout(graph);

  return nodes.map((node) => {
    const position = graph.node(node.id);
    const width = (node.measured?.width ?? node.width ?? 200) as number;
    const height = (node.measured?.height ?? node.height ?? 70) as number;
    return {
      ...node,
      position: {
        x: position.x - width / 2,
        y: position.y - height / 2,
      },
    };
  });
}

function filterPages(pages: Page[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return pages;

  return pages.filter((page) => {
    const text = [
      page.pageSlug,
      page.MetaData?.title,
      page.MetaData?.description,
      page.contentRelationships?.topicCluster,
    ].filter(Boolean).join(' ').toLowerCase();
    return text.includes(normalizedQuery);
  });
}

function getStats(pages: Page[]) {
  const hubCount = pages.filter((page) => page.contentRelationships?.isHub).length;
  const renderedSpokeIds = new Set<string>();

  pages.filter((page) => page.contentRelationships?.isHub).forEach((hub) => {
    pages
      .filter((page) => page.contentRelationships?.hubPageSlug === hub.pageSlug && !page.contentRelationships?.isHub)
      .forEach((spoke) => renderedSpokeIds.add(spoke.pageSlug));
  });

  const pageSlugs = new Set(pages.map((page) => page.pageSlug));
  const orphanedCount = pages.filter((page) => {
    if (page.contentRelationships?.isHub) return false;
    const hubSlug = page.contentRelationships?.hubPageSlug;
    return !hubSlug || !pageSlugs.has(hubSlug) || !renderedSpokeIds.has(page.pageSlug);
  }).length;

  return { hubCount, spokeCount: renderedSpokeIds.size, orphanedCount };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-24 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-neutral-950">{value}</p>
    </div>
  );
}

function LegendItem({ color, border, label, value }: { color: string; border: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block h-3 w-3 shrink-0 rounded-sm" style={{ background: color, border }} />
      <span className="text-xs text-neutral-600">{label}</span>
      <span className="rounded-full bg-neutral-100 px-1.5 text-[10px] font-semibold text-neutral-700">{value}</span>
    </div>
  );
}

function EdgeLegend({
  color,
  label,
  width = 2,
  dashed = false,
  className = '',
}: {
  color: string;
  label: string;
  width?: number;
  dashed?: boolean;
  className?: string;
}) {
  return (
    <div className={['flex items-center gap-2', className].join(' ')}>
      <svg className="h-2.5 w-5 shrink-0" viewBox="0 0 20 10">
        <line
          x1="0"
          y1="5"
          x2="20"
          y2="5"
          stroke={color}
          strokeWidth={width}
          strokeDasharray={dashed ? '5 3' : undefined}
        />
      </svg>
      <span className="text-xs text-neutral-600">{label}</span>
    </div>
  );
}

async function getErrorMessage(response: Response) {
  const text = await response.text();
  if (!text) return 'Unable to save layout.';

  try {
    const data = JSON.parse(text) as { message?: string; detail?: string; title?: string };
    return data.message || data.detail || data.title || text;
  } catch {
    return text;
  }
}

function encodeSlugPath(slug: string) {
  return slug
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}
