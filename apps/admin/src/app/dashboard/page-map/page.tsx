'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api'
import TenantSelector from '@/components/TenantSelector'
import type { Page } from 'pumpkin-ts-models'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

export default function PageMapPage() {
  const { token, currentTenant } = useAuth()
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    async function fetchPages() {
      if (!token || !currentTenant) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        
        const fetchedPages = await apiClient.getPages(token, currentTenant.tenantId)
        setPages(fetchedPages)
        
        console.log('[Page Map] Fetched pages:', fetchedPages.length)
        
        // Build flow nodes and edges
        const { nodes: flowNodes, edges: flowEdges } = buildFlowGraph(fetchedPages)
        console.log('[Page Map] Created nodes:', flowNodes.length, 'edges:', flowEdges.length)
        setNodes(flowNodes)
        setEdges(flowEdges)
      } catch (err: any) {
        console.error('[Page Map] Failed to load pages:', err)
        setError('Failed to load pages')
      } finally {
        setLoading(false)
      }
    }

    fetchPages()
  }, [token, currentTenant])

  const buildFlowGraph = (pages: Page[]): { nodes: Node[], edges: Edge[] } => {
    const flowNodes: Node[] = []
    const flowEdges: Edge[] = []
    
    const hubs = pages.filter(p => p.contentRelationships?.isHub)
    const orphaned = pages.filter(p => 
      !p.contentRelationships?.isHub && 
      !p.contentRelationships?.hubPageSlug
    )
    
    // Position hubs vertically with spacing
    hubs.forEach((hub, hubIndex) => {
      const hubY = hubIndex * 300
      const hubX = 100
      
      // Add hub node
      flowNodes.push({
        id: hub.id,
        type: 'default',
        position: { x: hubX, y: hubY },
        data: {
          label: (
            <div className="text-center">
              <div className="font-semibold text-primary-700">{hub.MetaData?.title || hub.pageSlug}</div>
              <div className="text-xs text-neutral-500 mt-1">Hub</div>
              {!hub.isPublished && (
                <div className="text-xs text-amber-600 mt-1">Draft</div>
              )}
            </div>
          )
        },
        style: {
          background: '#fff7ed',
          border: '2px solid #f97316',
          borderRadius: '8px',
          padding: '12px 20px',
          minWidth: '180px',
        },
      })
      
      // Find and position spokes for this hub
      const spokes = pages.filter(p => 
        p.contentRelationships?.hubPageSlug === hub.pageSlug &&
        !p.contentRelationships?.isHub
      )
      
      spokes.forEach((spoke, spokeIndex) => {
        const spokeY = hubY + (spokeIndex - (spokes.length - 1) / 2) * 80
        const spokeX = hubX + 400
        
        // Add spoke node
        flowNodes.push({
          id: spoke.id,
          type: 'default',
          position: { x: spokeX, y: spokeY },
          data: {
            label: (
              <div className="text-center">
                <div className="font-medium text-neutral-700">{spoke.MetaData?.title || spoke.pageSlug}</div>
                {!spoke.isPublished && (
                  <div className="text-xs text-amber-600 mt-1">Draft</div>
                )}
              </div>
            )
          },
          style: {
            background: '#ffffff',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            padding: '10px 16px',
            minWidth: '150px',
          },
        })
        
        // Add edge from hub to spoke
        flowEdges.push({
          id: `${hub.id}-${spoke.id}`,
          source: hub.id,
          target: spoke.id,
          type: 'smoothstep',
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#f97316',
          },
          style: {
            stroke: '#f97316',
            strokeWidth: 2,
          },
        })
      })
    })
    
    // Position orphaned pages at the bottom
    if (orphaned.length > 0) {
      const orphanedY = hubs.length * 300 + 100
      orphaned.forEach((orphan, index) => {
        flowNodes.push({
          id: orphan.id,
          type: 'default',
          position: { x: 100 + (index % 3) * 250, y: orphanedY + Math.floor(index / 3) * 100 },
          data: {
            label: (
              <div className="text-center">
                <div className="font-medium text-amber-700">{orphan.MetaData?.title || orphan.pageSlug}</div>
                <div className="text-xs text-amber-600 mt-1">Orphaned</div>
                {!orphan.isPublished && (
                  <div className="text-xs text-neutral-500">Draft</div>
                )}
              </div>
            )
          },
          style: {
            background: '#fffbeb',
            border: '2px dashed #f59e0b',
            borderRadius: '8px',
            padding: '10px 16px',
            minWidth: '150px',
          },
        })
      })
    }
    
    return { nodes: flowNodes, edges: flowEdges }
  }

  const hubCount = pages.filter(p => p.contentRelationships?.isHub).length
  const spokeCount = pages.filter(p => 
    !p.contentRelationships?.isHub && 
    p.contentRelationships?.hubPageSlug
  ).length
  const orphanedCount = pages.filter(p => 
    !p.contentRelationships?.isHub && 
    !p.contentRelationships?.hubPageSlug
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
    <div className="-mx-6 lg:-mx-8 -my-8">
      {/* Legend with Tenant Selector - Full Width */}
      <div className="bg-white border-b border-neutral-200 px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
          <h3 className="text-sm font-semibold text-neutral-700">Legend</h3>
          <TenantSelector />
        </div>
        <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ background: '#fff7ed', border: '2px solid #f97316' }}></div>
              <span className="text-sm text-neutral-600">Hub Page</span>
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                {hubCount}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ background: '#ffffff', border: '2px solid #e5e7eb' }}></div>
              <span className="text-sm text-neutral-600">Spoke Page</span>
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                {spokeCount}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ background: '#fffbeb', border: '2px dashed #f59e0b' }}></div>
              <span className="text-sm text-neutral-600">Orphaned Page</span>
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                {orphanedCount}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-shrink-0">
                <svg className="w-6 h-3" viewBox="0 0 24 12">
                  <path d="M0 6 L24 6" stroke="#f97316" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                  <defs>
                    <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                      <path d="M0,0 L0,6 L9,3 z" fill="#f97316" />
                    </marker>
                  </defs>
                </svg>
              </div>
              <span className="text-sm text-neutral-600">Relationship</span>
            </div>
            <div className="flex items-center space-x-2 ml-auto">
              <span className="text-sm text-neutral-500">Total:</span>
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                {pages.length}
              </span>
            </div>
          </div>
        </div>

      {/* Flow Diagram - Fill Remaining Space */}
      <div className="bg-white" style={{ height: 'calc(100vh - 64px - 96px)', width: '100%' }}>
          {nodes.length > 0 ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
              attributionPosition="bottom-left"
            >
              <Background color="#f5f5f5" gap={16} />
              <Controls />
              <MiniMap 
                nodeColor={(node) => {
                  if (node.style?.border === '2px solid #f97316') return '#f97316'
                  if (node.style?.border === '2px dashed #f59e0b') return '#f59e0b'
                  return '#e5e7eb'
                }}
                maskColor="rgba(0, 0, 0, 0.1)"
              />
            </ReactFlow>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-neutral-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No Pages Found</h3>
                <p className="text-neutral-600">Create pages to see your content hierarchy</p>
              </div>
            </div>
          )}
      </div>
    </div>
  )
}
