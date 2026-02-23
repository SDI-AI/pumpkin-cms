'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api'
import AddSpokeModal from '@/components/AddSpokeModal'
import type { Page, NodePosition } from 'pumpkin-ts-models'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import Dagre from '@dagrejs/dagre'

// Node size constants (dagre needs these to compute spacing)
const HUB_WIDTH = 180
const HUB_HEIGHT = 60
const SPOKE_WIDTH = 160
const SPOKE_HEIGHT = 48
const ORPHAN_WIDTH = 160
const ORPHAN_HEIGHT = 52

/** Use dagre to auto-layout nodes so nothing overlaps */
function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: 'LR',       // left → right
    nodesep: 60,          // vertical gap between nodes in the same rank
    ranksep: 180,         // horizontal gap between ranks
    marginx: 40,
    marginy: 40,
  })

  nodes.forEach((node) => {
    const w = (node.measured?.width ?? node.width ?? 200) as number
    const h = (node.measured?.height ?? node.height ?? 70) as number
    g.setNode(node.id, { width: w, height: h })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  Dagre.layout(g)

  return nodes.map((node) => {
    const pos = g.node(node.id)
    const w = (node.measured?.width ?? node.width ?? 200) as number
    const h = (node.measured?.height ?? node.height ?? 70) as number
    return {
      ...node,
      position: {
        x: pos.x - w / 2,
        y: pos.y - h / 2,
      },
    }
  })
}

export default function PageMapPage() {
  const router = useRouter()
  const { token, currentTenant } = useAuth()
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [addSpokeHub, setAddSpokeHub] = useState<string | null>(null)
  const [savedPositions, setSavedPositions] = useState<Record<string, NodePosition>>({})
  const [savingLayout, setSavingLayout] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleAddSpoke = useCallback((hubSlug: string) => {
    setAddSpokeHub(hubSlug)
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Save node positions to ALL pages' layoutPositions field for reliability
  const saveLayoutPositions = useCallback(async (currentNodes: Node[]) => {
    if (!token || !currentTenant || savingLayout || currentNodes.length === 0) return

    console.log('[Page Map] saveLayoutPositions called with', currentNodes.length, 'nodes')
    console.log('[Page Map] First 3 nodes:', currentNodes.slice(0, 3).map(n => ({ id: n.id, pos: n.position })))

    setSavingLayout(true)
    try {
      // Build position map
      const positions: Record<string, NodePosition> = {}
      currentNodes.forEach(node => {
        positions[node.id] = { x: node.position.x, y: node.position.y }
      })

      console.log('[Page Map] Saving positions for nodes:', Object.keys(positions))
      console.log('[Page Map] Position details:', JSON.stringify(positions, null, 2))

      // Save to ALL pages so layout persists regardless of hub/published status
      const updatePromises = pages.map(page => {
        const updatedPage = {
          ...page,
          layoutPositions: positions,
          MetaData: {
            ...page.MetaData,
            updatedAt: new Date().toISOString(),
          },
        }
        return apiClient.updatePage(token, currentTenant.tenantId, page.pageSlug, updatedPage)
      })

      await Promise.all(updatePromises)
      setSavedPositions(positions)
      console.log('[Page Map] ✓ Saved layout positions to all', pages.length, 'pages')
    } catch (err) {
      console.error('[Page Map] Failed to save layout positions:', err)
    } finally {
      setSavingLayout(false)
    }
  }, [token, currentTenant, pages, savingLayout])

  // Reset layout to use Dagre auto-layout
  const resetLayout = useCallback(() => {
    if (!confirm('Reset layout to automatic positioning?')) return

    const { nodes: rawNodes, edges: flowEdges } = buildFlowGraph(pages)
    const layoutNodes = applyDagreLayout(rawNodes, flowEdges)
    setNodes(layoutNodes)
    setSavedPositions({})
    
    // Save the new layout
    saveLayoutPositions(layoutNodes)
  }, [pages, saveLayoutPositions])

  // Handle node drag end to save positions with debounce
  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, draggedNode: Node) => {
      console.log('[Page Map] Node drag stopped:', draggedNode.id, 'at position', draggedNode.position)
      
      // Clear any pending save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      
      // Debounce the save by 500ms to batch multiple drags
      saveTimeoutRef.current = setTimeout(() => {
        console.log('[Page Map] Debounced save triggered, current nodes state:', nodes.length)
        // Use the current nodes from state (they're updated by ReactFlow via onNodesChange)
        saveLayoutPositions(nodes)
      }, 500)
    },
    [nodes, saveLayoutPositions]
  )

  const handleConfirmAddSpoke = useCallback((slug: string) => {
    const hubSlug = addSpokeHub
    setAddSpokeHub(null)
    if (!hubSlug) return
    const tenantId = currentTenant?.tenantId || ''
    router.push(`/dashboard/pages/new?tenantId=${encodeURIComponent(tenantId)}&hubPageSlug=${encodeURIComponent(hubSlug)}&pageSlug=${encodeURIComponent(slug)}`)
  }, [addSpokeHub, currentTenant, router])

  useEffect(() => {
    async function fetchPages() {
      if (!token || !currentTenant) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        console.log('[Page Map] Fetching pages for tenant:', currentTenant.tenantId)
        
        const fetchedPages = await apiClient.getPages(token, currentTenant.tenantId)
        console.log('[Page Map] Fetched pages:', fetchedPages.length, fetchedPages.map(p => p.pageSlug))
        setPages(fetchedPages)
        
        if (fetchedPages.length === 0) {
          console.log('[Page Map] No pages returned from API')
          setNodes([])
          setEdges([])
          return
        }
        
        // Check if any page has saved layout positions (check all pages, use first found)
        const savedLayout = fetchedPages.find(p => p.layoutPositions && Object.keys(p.layoutPositions).length > 0)?.layoutPositions
        
        if (savedLayout) {
          console.log('[Page Map] Found saved layout with', Object.keys(savedLayout).length, 'positions')
          console.log('[Page Map] Saved layout node IDs:', Object.keys(savedLayout))
        }
        
        const { nodes: rawNodes, edges: flowEdges } = buildFlowGraph(fetchedPages)
        console.log('[Page Map] Built graph — nodes:', rawNodes.length, 'edges:', flowEdges.length)
        console.log('[Page Map] Raw node IDs:', rawNodes.map(n => n.id))
        
        let finalNodes: Node[]
        if (savedLayout && Object.keys(savedLayout).length > 0) {
          // Apply saved positions
          console.log('[Page Map] Applying saved layout positions')
          finalNodes = rawNodes.map(node => {
            const savedPos = savedLayout[node.id]
            if (savedPos) {
              console.log(`[Page Map] Node ${node.id}: Applying saved position (${savedPos.x}, ${savedPos.y})`)
            } else {
              console.warn(`[Page Map] Node ${node.id}: No saved position found, using default (${node.position.x}, ${node.position.y})`)
            }
            return {
              ...node,
              position: savedPos || node.position
            }
          })
          setSavedPositions(savedLayout)
        } else {
          // Let dagre compute non-overlapping positions
          console.log('[Page Map] No saved layout, using Dagre auto-layout')
          finalNodes = applyDagreLayout(rawNodes, flowEdges)
        }
        
        console.log('[Page Map] Final positioned nodes:', finalNodes.length)
        setNodes(finalNodes)
        setEdges(flowEdges)
      } catch (err: any) {
        console.error('[Page Map] Failed to load pages:', err)
        setError('Failed to load pages. Check console for details.')
      } finally {
        setLoading(false)
      }
    }

    fetchPages()
  }, [token, currentTenant])

  const buildFlowGraph = (pages: Page[]): { nodes: Node[], edges: Edge[] } => {
    const flowNodes: Node[] = []
    const flowEdges: Edge[] = []
    const renderedPageIds = new Set<string>()

    // Build lookup maps
    const pageBySlug = new Map<string, Page>()
    pages.forEach(p => { if (p.pageSlug) pageBySlug.set(p.pageSlug, p) })

    const hubs = pages.filter(p => p.contentRelationships?.isHub)

    hubs.forEach((hub) => {
      renderedPageIds.add(hub.pageSlug)

      // Hub node (use pageSlug as ID for stability)
      flowNodes.push({
        id: hub.pageSlug,
        type: 'default',
        position: { x: 0, y: 0 }, // dagre will reposition
        width: HUB_WIDTH,
        height: HUB_HEIGHT,
        data: {
          label: (
            <div className="text-center">
              <div className="font-semibold text-xs leading-snug truncate" style={{ color: '#c2410c', maxWidth: HUB_WIDTH - 24 }}>
                {hub.MetaData?.title || hub.pageSlug}
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <span className="text-[9px] uppercase tracking-wider" style={{ color: '#9a3412' }}>Hub</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleAddSpoke(hub.pageSlug) }}
                  className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-bold leading-none hover:scale-110 transition-transform"
                  style={{ background: '#f97316', color: '#fff' }}
                  title="Add spoke page"
                >+</button>
              </div>
              {hub.contentRelationships?.topicCluster && (
                <div className="text-[9px] mt-0.5 truncate" style={{ color: '#ea580c', maxWidth: HUB_WIDTH - 24 }}>{hub.contentRelationships.topicCluster}</div>
              )}
              {!hub.isPublished && (
                <div className="text-[9px] mt-0.5 italic" style={{ color: '#d97706' }}>Draft</div>
              )}
            </div>
          )
        },
        style: {
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
          border: '2px solid #f97316',
          borderRadius: '10px',
          padding: '8px 10px',
          width: HUB_WIDTH,
          boxShadow: '0 3px 8px rgba(249, 115, 22, 0.12)',
        },
      })

      // Spokes for this hub (non-hub pages only)
      const spokes = pages.filter(p =>
        p.contentRelationships?.hubPageSlug === hub.pageSlug &&
        !p.contentRelationships?.isHub
      )

      spokes.forEach((spoke) => {
        renderedPageIds.add(spoke.pageSlug)

        flowNodes.push({
          id: spoke.pageSlug,
          type: 'default',
          position: { x: 0, y: 0 },
          width: SPOKE_WIDTH,
          height: SPOKE_HEIGHT,
          data: {
            label: (
              <div className="text-center">
                <div className="font-medium text-xs leading-snug truncate text-neutral-800" style={{ maxWidth: SPOKE_WIDTH - 24 }}>
                  {spoke.MetaData?.title || spoke.pageSlug}
                </div>
                {spoke.contentRelationships?.topicCluster && (
                  <div className="text-[9px] mt-0.5 truncate" style={{ color: '#6366f1', maxWidth: SPOKE_WIDTH - 24 }}>{spoke.contentRelationships.topicCluster}</div>
                )}
                {!spoke.isPublished && (
                  <div className="text-[9px] mt-0.5 italic" style={{ color: '#d97706' }}>Draft</div>
                )}
              </div>
            )
          },
          style: {
            background: '#ffffff',
            border: '1.5px solid #d1d5db',
            borderRadius: '8px',
            padding: '6px 10px',
            width: SPOKE_WIDTH,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          },
        })

        flowEdges.push({
          id: `hub-spoke-${hub.pageSlug}-${spoke.pageSlug}`,
          source: hub.pageSlug,
          target: spoke.pageSlug,
          type: 'default',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#f97316', width: 16, height: 16 },
          style: { stroke: '#f97316', strokeWidth: 2 },
        })
      })
    })

    // Hub-to-hub hierarchical edges (after all hubs are processed)
    hubs.forEach(hub => {
      const childHubs = pages.filter(p =>
        p.contentRelationships?.hubPageSlug === hub.pageSlug &&
        p.contentRelationships?.isHub
      )

      childHubs.forEach((childHub) => {
        if (renderedPageIds.has(childHub.pageSlug)) {
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
          })
        }
      })
    })

    // Related-hub edges (blue dashed)
    const addedRelatedEdges = new Set<string>()
    hubs.forEach(hub => {
      (hub.contentRelationships?.relatedHubs || []).forEach(slug => {
        const rel = pageBySlug.get(slug)
        if (rel && renderedPageIds.has(rel.pageSlug)) {
          const key = [hub.pageSlug, rel.pageSlug].sort().join('|')
          if (!addedRelatedEdges.has(key)) {
            addedRelatedEdges.add(key)
            flowEdges.push({
              id: `related-${key}`,
              source: hub.pageSlug,
              target: rel.pageSlug,
              type: 'default',
              animated: false,
              label: 'related',
              labelStyle: { fontSize: 9, fill: '#3b82f6', fontWeight: 500 },
              labelBgStyle: { fill: '#eff6ff', fillOpacity: 0.9 },
              labelBgPadding: [4, 2] as [number, number],
              labelBgBorderRadius: 4,
              markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6', width: 14, height: 14 },
              style: { stroke: '#3b82f6', strokeWidth: 1.5, strokeDasharray: '8 4' },
            })
          }
        }
      })
    })

    // Orphaned pages — no edges, dagre will still position them
    const orphaned = pages.filter(p => !renderedPageIds.has(p.pageSlug))
    orphaned.forEach((orphan) => {
      flowNodes.push({
        id: orphan.pageSlug,
        type: 'default',
        position: { x: 0, y: 0 },
        width: ORPHAN_WIDTH,
        height: ORPHAN_HEIGHT,
        data: {
          label: (
            <div className="text-center">
              <div className="font-medium text-xs leading-snug truncate" style={{ color: '#92400e', maxWidth: ORPHAN_WIDTH - 24 }}>
                {orphan.MetaData?.title || orphan.pageSlug}
              </div>
              <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: '#b45309' }}>Orphaned</div>
              {orphan.contentRelationships?.hubPageSlug && (
                <div className="text-[9px] mt-0.5 truncate" style={{ color: '#dc2626', maxWidth: ORPHAN_WIDTH - 24 }}>
                  Missing hub: {orphan.contentRelationships.hubPageSlug}
                </div>
              )}
              {!orphan.isPublished && (
                <div className="text-[9px] mt-0.5 italic" style={{ color: '#d97706' }}>Draft</div>
              )}
            </div>
          )
        },
        style: {
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          border: '2px dashed #f59e0b',
          borderRadius: '8px',
          padding: '6px 10px',
          width: ORPHAN_WIDTH,
          boxShadow: '0 2px 4px rgba(245, 158, 11, 0.10)',
        },
      })
    })

    return { nodes: flowNodes, edges: flowEdges }
  }

  // ── Stats ──
  const hubCount = pages.filter(p => p.contentRelationships?.isHub).length
  const renderedSpokeIds = new Set<string>()
  pages.filter(p => p.contentRelationships?.isHub).forEach(hub => {
    pages.filter(p =>
      p.contentRelationships?.hubPageSlug === hub.pageSlug &&
      !p.contentRelationships?.isHub
    ).forEach(s => renderedSpokeIds.add(s.id))
  })
  const spokeCount = renderedSpokeIds.size
  const orphanedCount = pages.filter(p =>
    !p.contentRelationships?.isHub && !renderedSpokeIds.has(p.id)
  ).length

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-neutral-600">Loading pages...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="-mx-6 lg:-mx-8 -my-8">
        <div className="bg-red-50 border-b border-red-200 px-6 lg:px-8 py-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="-mx-6 lg:-mx-8 -my-8 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Flow Diagram — fills available space */}
      <div className="flex-1 min-h-0 bg-neutral-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={handleNodeDragStop}
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
            style={{ display: 'flex', flexDirection: 'column', gap: 2, borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}
          />
          {nodes.length > 0 && (
            <MiniMap
              nodeColor={(node) => {
                const border = String(node.style?.border || '')
                if (border.includes('#f97316')) return '#f97316'
                if (border.includes('#f59e0b')) return '#f59e0b'
                return '#d1d5db'
              }}
              maskColor="rgba(0, 0, 0, 0.08)"
              style={{ borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}
              pannable
              zoomable
            />
          )}

          {/* Reset Layout Button */}
          <Panel position="top-right">
            <div className="flex gap-2">
              <button
                onClick={resetLayout}
                disabled={savingLayout || loading}
                className="bg-white/95 backdrop-blur-sm hover:bg-white rounded-lg shadow-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {savingLayout ? 'Saving...' : '🔄 Reset Layout'}
              </button>
            </div>
          </Panel>

          {/* Legend as floating panel — always visible */}
          <Panel position="top-left">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-neutral-200 px-5 py-3.5 max-w-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2.5">Legend</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                {/* Nodes */}
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-sm shrink-0" style={{ background: 'linear-gradient(135deg,#fff7ed,#ffedd5)', border: '2px solid #f97316' }} />
                  <span className="text-xs text-neutral-600">Hub</span>
                  <span className="text-[10px] font-semibold text-primary-600 bg-primary-50 rounded-full px-1.5">{hubCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-sm shrink-0" style={{ background: '#fff', border: '1.5px solid #d1d5db' }} />
                  <span className="text-xs text-neutral-600">Spoke</span>
                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 rounded-full px-1.5">{spokeCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-sm shrink-0" style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '2px dashed #f59e0b' }} />
                  <span className="text-xs text-neutral-600">Orphaned</span>
                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 rounded-full px-1.5">{orphanedCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">Total</span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 rounded-full px-1.5">{pages.length}</span>
                </div>
                {/* Edges */}
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-2.5 shrink-0" viewBox="0 0 20 10"><line x1="0" y1="5" x2="20" y2="5" stroke="#f97316" strokeWidth="2" /></svg>
                  <span className="text-xs text-neutral-600">Hub → Spoke</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-2.5 shrink-0" viewBox="0 0 20 10"><line x1="0" y1="5" x2="20" y2="5" stroke="#dc2626" strokeWidth="3" /></svg>
                  <span className="text-xs text-neutral-600">Hub → Sub-Hub</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <svg className="w-5 h-2.5 shrink-0" viewBox="0 0 20 10"><line x1="0" y1="5" x2="20" y2="5" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5 3" /></svg>
                  <span className="text-xs text-neutral-600">Related Hubs</span>
                </div>
              </div>
            </div>
          </Panel>

          {/* Empty state overlay when no nodes */}
          {nodes.length === 0 && !loading && (
            <Panel position="top-center">
              <div className="mt-32 text-center py-8 px-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-neutral-200">
                <svg className="w-12 h-12 text-neutral-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-base font-medium text-neutral-900 mb-1">No Pages Found</h3>
                <p className="text-sm text-neutral-500">
                  {currentTenant ? `No pages for "${currentTenant.tenantId}". Create pages to see your content hierarchy.` : 'Select a tenant to view pages.'}
                </p>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* Add Spoke Modal */}
      {addSpokeHub && (
        <AddSpokeModal
          hubPageSlug={addSpokeHub}
          onConfirm={handleConfirmAddSpoke}
          onCancel={() => setAddSpokeHub(null)}
        />
      )}
    </div>
  )
}
