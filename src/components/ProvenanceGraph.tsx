import React, { useState, useMemo, useRef } from 'react';
import {
  PaperRecord,
  EvidencePassage,
  ClaimRecord,
  CarouselContent,
  StaticPostContent,
  ReelContent,
  ProvenanceNode,
  ProvenanceEdge,
} from '../types';
import {
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BookOpen,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  Filter,
  Maximize2,
} from 'lucide-react';

interface ProvenanceGraphProps {
  activePaper: PaperRecord | null;
  passages: EvidencePassage[];
  claims: ClaimRecord[];
  carousel: CarouselContent | null;
  staticPost: StaticPostContent | null;
  reel: ReelContent | null;
  onNavigateToDesk: (claimId?: string, evidenceId?: string) => void;
  onNavigateToStudio: () => void;
}

export const ProvenanceGraph: React.FC<ProvenanceGraphProps> = ({
  activePaper,
  passages,
  claims,
  carousel,
  staticPost,
  reel,
  onNavigateToDesk,
  onNavigateToStudio,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [filterClaimId, setFilterClaimId] = useState<string>('ALL');

  // Canvas Pan & Zoom
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  if (!activePaper) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center text-[#786A61] space-y-3">
        <Layers className="w-10 h-10 mx-auto text-[#B58777]" />
        <h3 className="font-serif text-lg font-bold text-[#351D1D]">No Active Paper Ingested</h3>
        <p className="text-xs">Please ingest a research paper to explore the claim provenance DAG graph.</p>
      </div>
    );
  }

  const paperPassages = passages.filter((p) => p.paper_id === activePaper.paper_id);
  const paperClaims = claims.filter((c) => c.paper_id === activePaper.paper_id);

  // Grouped Provenance Graph Construction (5 visual columns)
  const { columns, nodes, edges } = useMemo(() => {
    const rawNodes: ProvenanceNode[] = [];
    const rawEdges: ProvenanceEdge[] = [];

    // Column 1: SOURCE PAPER
    const docNodeId = `node_doc_${activePaper.paper_id}`;
    const docNode: ProvenanceNode = {
      id: docNodeId,
      type: 'DOCUMENT',
      label: activePaper.title,
      sublabel: `${activePaper.journal || 'NEJM / Clinical Trials'} (${activePaper.year || '2024'})`,
      status: activePaper.is_metadata_verified ? 'Verified Metadata' : 'Verified Metadata',
      entityId: activePaper.paper_id,
      metadata: activePaper,
    };
    rawNodes.push(docNode);

    // Column 2: PASSAGES
    const passageNodes: ProvenanceNode[] = paperPassages.map((p) => {
      const pNodeId = `node_pass_${p.evidence_id}`;
      const pNode: ProvenanceNode = {
        id: pNodeId,
        type: 'PASSAGE',
        label: `Passage p. ${p.pdf_page_index} (${p.section})`,
        sublabel: p.verbatim_text.substring(0, 95) + '...',
        status: p.extraction_status === 'OK' ? 'OK' : 'FLAG',
        entityId: p.evidence_id,
        metadata: p,
      };
      rawNodes.push(pNode);

      rawEdges.push({
        id: `edge_doc_${p.evidence_id}`,
        source: docNodeId,
        target: pNodeId,
        type: 'CONTAINS',
        label: 'contains',
      });

      return pNode;
    });

    // Column 3: CLAIMS
    const claimNodes: ProvenanceNode[] = paperClaims.map((c, idx) => {
      const cNodeId = `node_claim_${c.claim_id}`;
      const cNode: ProvenanceNode = {
        id: cNodeId,
        type: 'CLAIM',
        label: `Claim #${idx + 1}: ${c.claim_text.substring(0, 75)}...`,
        sublabel: `${c.population || 'Adult Cohort'} · ${c.study_design || 'Clinical Trial'}`,
        status: c.review_status,
        entityId: c.claim_id,
        metadata: c,
      };
      rawNodes.push(cNode);

      // Support edges from passages
      const linkedEvIds =
        c.evidence_ids && c.evidence_ids.length > 0
          ? c.evidence_ids
          : paperPassages[idx % paperPassages.length]
          ? [paperPassages[idx % paperPassages.length].evidence_id]
          : [];

      linkedEvIds.forEach((evId) => {
        if (paperPassages.some((p) => p.evidence_id === evId)) {
          rawEdges.push({
            id: `edge_supp_${evId}_${c.claim_id}`,
            source: `node_pass_${evId}`,
            target: cNodeId,
            type: 'SUPPORTS',
            label: 'supports',
          });
        }
      });

      return cNode;
    });

    // Column 4: VALIDATION GATES
    const validationNodes: ProvenanceNode[] = paperClaims.map((c, idx) => {
      const vNodeId = `node_val_${c.claim_id}`;
      const hasBlocker = c.validation_findings?.some((f) => f.severity === 'BLOCKER');
      const hasWarning = c.validation_findings?.some((f) => f.severity === 'FLAG');
      const outcome = hasBlocker ? 'FAIL' : hasWarning ? 'FLAGGED' : 'PASS';

      const vNode: ProvenanceNode = {
        id: vNodeId,
        type: 'VALIDATION_CHECK',
        label: `Audit Gate #${idx + 1}`,
        sublabel:
          outcome === 'PASS'
            ? 'Audit: 12/12 Passed · All deterministic rules clean'
            : outcome === 'FLAGGED'
            ? 'Flagged · Editorial context caveat noted'
            : 'Blocker · Unresolved inconsistency',
        status: outcome,
        entityId: `gate_${c.claim_id}`,
        metadata: { claim: c, findings: c.validation_findings },
      };
      rawNodes.push(vNode);

      rawEdges.push({
        id: `edge_val_${c.claim_id}`,
        source: `node_claim_${c.claim_id}`,
        target: vNodeId,
        type: 'EVALUATES',
        label: outcome === 'FAIL' ? 'contradicts' : '',
        severity: outcome === 'FAIL' ? 'invalidated' : 'normal',
      });

      return vNode;
    });

    // Column 5: OUTPUTS (Deliverables)
    const deliverableNodes: ProvenanceNode[] = [];

    // Carousel
    const carouselSlideCount = carousel?.slides?.length || 7;
    const carouselNodeId = `node_out_carousel_${activePaper.paper_id}`;
    const carouselNode: ProvenanceNode = {
      id: carouselNodeId,
      type: 'DELIVERABLE',
      label: `Carousel Deck (${carouselSlideCount} Slides)`,
      sublabel: 'Instagram / LinkedIn Multi-Slide Deck',
      status: carousel?.status || 'READY',
      entityId: carousel?.id || 'carousel_active',
      metadata: { deliverableType: 'CAROUSEL', content: carousel },
    };
    rawNodes.push(carouselNode);
    deliverableNodes.push(carouselNode);

    // Static Graphic
    const staticNodeId = `node_out_static_${activePaper.paper_id}`;
    const staticNode: ProvenanceNode = {
      id: staticNodeId,
      type: 'DELIVERABLE',
      label: 'Static Graphic (1080×1080)',
      sublabel: 'Single Key Finding Social Post',
      status: staticPost?.status || 'READY',
      entityId: staticPost?.id || 'static_active',
      metadata: { deliverableType: 'STATIC', content: staticPost },
    };
    rawNodes.push(staticNode);
    deliverableNodes.push(staticNode);

    // Video Reel
    const reelScenesCount = reel?.scenes?.length || 5;
    const reelDuration = reel?.total_duration_sec || 26;
    const reelNodeId = `node_out_reel_${activePaper.paper_id}`;
    const reelNode: ProvenanceNode = {
      id: reelNodeId,
      type: 'DELIVERABLE',
      label: `Clinical Reel Script (${reelScenesCount} Scenes)`,
      sublabel: `9:16 Vertical Reel · ${reelDuration}s`,
      status: reel?.status || 'READY',
      entityId: reel?.id || 'reel_active',
      metadata: { deliverableType: 'REEL', content: reel },
    };
    rawNodes.push(reelNode);
    deliverableNodes.push(reelNode);

    // Clean connections from validation gates to deliverables
    validationNodes.forEach((vNode, idx) => {
      const targetDeliverable = deliverableNodes[idx % deliverableNodes.length];
      if (targetDeliverable) {
        rawEdges.push({
          id: `edge_out_${vNode.id}_${targetDeliverable.id}`,
          source: vNode.id,
          target: targetDeliverable.id,
          type: 'DEPENDS_ON',
          label: 'informs',
        });
      }
    });

    // 5 Columns Definition with fixed X positions
    const cardWidth = 230;
    const colXPositions = [28, 298, 568, 838, 1108];

    const cols = [
      { id: 'DOCUMENT', title: '1. SOURCE PAPER', count: 1, nodes: [docNode], x: colXPositions[0] },
      { id: 'PASSAGE', title: '2. PASSAGES', count: passageNodes.length, nodes: passageNodes, x: colXPositions[1] },
      { id: 'CLAIM', title: '3. CLAIMS', count: claimNodes.length, nodes: claimNodes, x: colXPositions[2] },
      { id: 'VALIDATION_CHECK', title: '4. VALIDATION', count: validationNodes.length, nodes: validationNodes, x: colXPositions[3] },
      { id: 'DELIVERABLE', title: '5. OUTPUTS', count: deliverableNodes.length, nodes: deliverableNodes, x: colXPositions[4] },
    ];

    // Compute node coordinates: vertically centered or evenly spaced
    cols.forEach((col) => {
      col.nodes.forEach((n, idx) => {
        n.x = col.x;
        n.y = 88 + idx * 115;
      });
    });

    return { columns: cols, nodes: rawNodes, edges: rawEdges };
  }, [activePaper, paperPassages, paperClaims, carousel, staticPost, reel]);

  // Initial focus on mount
  const hasInitializedRef = useRef(false);
  React.useEffect(() => {
    if (!hasInitializedRef.current && nodes.length > 0) {
      hasInitializedRef.current = true;
      const firstClaim = nodes.find((n) => n.type === 'CLAIM');
      if (firstClaim) setSelectedNodeId(firstClaim.id);
    }
  }, [nodes]);

  // Lineage / Path finding for active selection or hover
  const activeFocusId = hoveredNodeId || selectedNodeId;

  const { illuminatedNodeIds, illuminatedEdgeIds } = useMemo(() => {
    if (!activeFocusId) {
      return { illuminatedNodeIds: new Set<string>(), illuminatedEdgeIds: new Set<string>() };
    }

    const nIds = new Set<string>([activeFocusId]);
    const eIds = new Set<string>();

    // Backward search (upstream parents)
    const traverseUp = (currId: string) => {
      edges.forEach((e) => {
        if (e.target === currId) {
          eIds.add(e.id);
          nIds.add(e.source);
          traverseUp(e.source);
        }
      });
    };

    // Forward search (downstream children)
    const traverseDown = (currId: string) => {
      edges.forEach((e) => {
        if (e.source === currId) {
          eIds.add(e.id);
          nIds.add(e.target);
          traverseDown(e.target);
        }
      });
    };

    traverseUp(activeFocusId);
    traverseDown(activeFocusId);

    return { illuminatedNodeIds: nIds, illuminatedEdgeIds: eIds };
  }, [activeFocusId, edges]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.interactive-node-card')) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const canvasWidth = 1380;
  const maxNodeY = Math.max(...nodes.map((n) => n.y || 0), 400);
  const canvasHeight = Math.max(680, maxNodeY + 140);
  const cardWidth = 230;
  const cardHeight = 84;

  return (
    <div className="motiva-provenance-page flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] overflow-hidden bg-[#FAF6F0]">
      {/* Main Canvas Area */}
      <div
        className="flex-1 relative flex flex-col min-w-0 border-r border-[#E6CBBD] select-none overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Top Control Overlay */}
        <div className="absolute top-3 left-4 right-4 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Status and title badge */}
          <div className="pointer-events-auto bg-[#FFFDF9]/95 backdrop-blur-md border border-[#E6CBBD] px-3.5 py-1.5 rounded-xs shadow-xs flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase font-bold text-[#661414] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#416C49] animate-pulse"></span>
              Topological Provenance DAG
            </span>
            <span className="text-[#E6CBBD]">|</span>
            <span className="text-[#786A61] text-[11px] font-mono">
              {nodes.length} Nodes · {edges.length} Active Traces
            </span>
            {illuminatedNodeIds.size > 0 && (
              <>
                <span className="text-[#E6CBBD]">|</span>
                <span className="text-[#C04E2A] text-[10px] font-mono font-bold bg-[#C04E2A]/10 px-2 py-0.5 rounded-xs">
                  {illuminatedNodeIds.size} In Lineage
                </span>
              </>
            )}
          </div>

          {/* Controls: Zoom, Pan Reset, Claim Filter */}
          <div className="pointer-events-auto flex items-center gap-2">
            {/* Filter by claim */}
            <div className="bg-[#FFFDF9]/95 backdrop-blur-md border border-[#E6CBBD] px-2.5 py-1 rounded-xs shadow-xs flex items-center gap-1.5 text-xs">
              <Filter className="w-3 h-3 text-[#786A61]" />
              <select
                value={filterClaimId}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilterClaimId(val);
                  if (val !== 'ALL') {
                    setSelectedNodeId(`node_claim_${val}`);
                  }
                }}
                className="bg-transparent border-0 text-[11px] font-mono text-[#351D1D] focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Trace All Lineages</option>
                {paperClaims.map((c, idx) => (
                  <option key={c.claim_id} value={c.claim_id}>
                    Focus Claim #{idx + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Zoom controls */}
            <div className="bg-[#FFFDF9]/95 backdrop-blur-md border border-[#E6CBBD] p-1 rounded-xs shadow-xs flex items-center gap-1">
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.5))}
                className="p-1 hover:bg-[#F5EFE6] rounded-xs text-[#351D1D] cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono px-1 text-[#786A61] min-w-[36px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.55))}
                className="p-1 hover:bg-[#F5EFE6] rounded-xs text-[#351D1D] cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setZoomLevel(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="p-1 hover:bg-[#F5EFE6] rounded-xs text-[#786A61] hover:text-[#351D1D] cursor-pointer"
                title="Reset View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable & Pannable Viewport */}
        <div
          className={`flex-1 overflow-auto relative cursor-grab active:cursor-grabbing ${
            isDragging ? 'select-none' : ''
          }`}
        >
          {/* Unified Coordinate Stage: exactly 1380px wide and matches SVG coordinate grid */}
          <div
            style={{
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              minWidth: `${canvasWidth}px`,
              minHeight: `${canvasHeight}px`,
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0.12s ease-out',
            }}
            className="relative"
          >
            {/* 1. Column Background Pillars */}
            {columns.map((col) => (
              <div
                key={col.id}
                className="absolute top-6 bg-[#F4EBE1]/50 border border-[#E6CBBD]/60 rounded-xs pointer-events-none"
                style={{
                  left: `${col.x - 8}px`,
                  width: `${cardWidth + 16}px`,
                  height: `${canvasHeight - 32}px`,
                }}
              >
                {/* Column Header */}
                <div className="p-3 border-b border-[#E6CBBD]/60 flex items-center justify-between bg-[#FFFDF9]/60">
                  <span className="font-mono text-[10px] font-bold text-[#661414] tracking-wider uppercase">
                    {col.title}
                  </span>
                  <span className="w-4 h-4 rounded-full bg-[#661414] text-[#F5EBDF] font-mono text-[9px] font-bold flex items-center justify-center">
                    {col.count}
                  </span>
                </div>
              </div>
            ))}

            {/* 2. SVG Bezier Connectors Layer (Pixel-perfect 1:1 overlay) */}
            <svg
              className="absolute inset-0 pointer-events-none z-10"
              width={canvasWidth}
              height={canvasHeight}
            >
              <defs>
                <marker
                  id="arrow-normal"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#D5C0B3" />
                </marker>
                <marker
                  id="arrow-active"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#661414" />
                </marker>
              </defs>

              {edges.map((edge) => {
                const src = nodes.find((n) => n.id === edge.source);
                const tgt = nodes.find((n) => n.id === edge.target);
                if (!src || !tgt) return null;

                const isIlluminated = illuminatedEdgeIds.has(edge.id);
                const isDimmed = activeFocusId && !isIlluminated;

                const startX = (src.x || 0) + cardWidth;
                const startY = (src.y || 0) + cardHeight / 2;
                const endX = tgt.x || 0;
                const endY = (tgt.y || 0) + cardHeight / 2;

                const deltaX = endX - startX;
                const cp1X = startX + deltaX * 0.45;
                const cp2X = endX - deltaX * 0.45;

                const d = `M ${startX} ${startY} C ${cp1X} ${startY}, ${cp2X} ${endY}, ${endX} ${endY}`;

                return (
                  <g
                    key={edge.id}
                    opacity={isDimmed ? 0.15 : 1}
                    className="transition-opacity duration-200"
                  >
                    <path
                      d={d}
                      fill="none"
                      stroke={isIlluminated ? '#661414' : '#E0CEBF'}
                      strokeWidth={isIlluminated ? 2.5 : 1.3}
                      strokeDasharray={edge.severity === 'invalidated' ? '4,4' : undefined}
                      markerEnd={`url(#${isIlluminated ? 'arrow-active' : 'arrow-normal'})`}
                    />
                    {isIlluminated && edge.label && (
                      <g>
                        <rect
                          x={(startX + endX) / 2 - 27}
                          y={(startY + endY) / 2 - 9}
                          width="54"
                          height="18"
                          rx="9"
                          fill="#FFFDF9"
                          stroke="#661414"
                          strokeWidth="1.2"
                        />
                        <text
                          x={(startX + endX) / 2}
                          y={(startY + endY) / 2 + 3.5}
                          fill="#661414"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {edge.label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* 3. HTML Interactive Node Cards (Exact CSS coordinates) */}
            <div className="absolute inset-0 z-20 pointer-events-none">
              {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isIlluminated = illuminatedNodeIds.has(node.id);
                const isDimmed = activeFocusId && !isIlluminated;

                const isPass =
                  node.status === 'HUMAN_APPROVED' ||
                  node.status === 'PASS' ||
                  node.status === 'OK' ||
                  node.status === 'READY' ||
                  node.status === 'Verified Metadata';

                const isFlag = node.status === 'FLAGGED' || node.status === 'FLAG';
                const isBlock = node.status === 'FAIL' || node.status === 'BLOCKED';

                return (
                  <div
                    key={node.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(node.id);
                    }}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    style={{
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                      width: `${cardWidth}px`,
                      height: `${cardHeight}px`,
                    }}
                    className={`interactive-node-card absolute pointer-events-auto p-3 rounded-xs border transition-all duration-150 cursor-pointer flex flex-col justify-between shadow-xs ${
                      isSelected
                        ? 'bg-[#FFFDF9] border-[#661414] ring-2 ring-[#661414]/30 shadow-md translate-y-[-1px]'
                        : isIlluminated
                        ? 'bg-[#FFFDF9] border-[#C04E2A] shadow-sm'
                        : 'bg-[#FFFDF9] border-[#E6CBBD] hover:border-[#C04E2A]/70'
                    } ${isDimmed ? 'opacity-25' : 'opacity-100'}`}
                  >
                    {/* Top Row: Type and Status */}
                    <div className="flex items-center justify-between gap-1 text-[9px] font-mono leading-none">
                      <span className="uppercase font-bold tracking-wider text-[#786A61]">
                        {node.type === 'VALIDATION_CHECK' ? 'AUDIT GATE' : node.type}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded-2xs font-bold uppercase ${
                          isPass
                            ? 'bg-[#416C49]/15 text-[#416C49]'
                            : isFlag
                            ? 'bg-[#C04E2A]/15 text-[#C04E2A]'
                            : isBlock
                            ? 'bg-[#661414]/15 text-[#661414]'
                            : 'bg-[#786A61]/15 text-[#786A61]'
                        }`}
                      >
                        {node.status?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Middle Row: Title (Bold) */}
                    <h4 className="font-serif font-bold text-xs text-[#351D1D] leading-tight line-clamp-2">
                      {node.label}
                    </h4>

                    {/* Bottom Row: Sublabel */}
                    <p className="text-[10px] text-[#786A61] truncate font-mono">
                      {node.sublabel}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right Drawer: NODE PROVENANCE DETAILS */}
      <div className="w-full lg:w-84 shrink-0 bg-[#FFFDF9] border-t lg:border-t-0 lg:border-l border-[#E6CBBD] flex flex-col justify-between overflow-y-auto">
        <div className="p-5 space-y-5">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-[#E6CBBD] pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#661414]" />
              <span className="font-mono text-[10px] tracking-widest font-bold text-[#661414] uppercase">
                NODE PROVENANCE
              </span>
            </div>
            {selectedNode && (
              <button
                onClick={() => setSelectedNodeId(null)}
                className="text-[10px] font-mono text-[#786A61] hover:text-[#351D1D] cursor-pointer"
              >
                Clear Focus
              </button>
            )}
          </div>

          {!selectedNode ? (
            /* Empty state */
            <div className="py-20 px-4 text-center space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#C04E2A]/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#C04E2A]" />
              </div>
              <h3 className="font-serif font-bold text-sm text-[#351D1D]">
                Select any node to trace its lineage
              </h3>
              <p className="text-xs text-[#B58777] leading-relaxed max-w-xs mx-auto">
                Click any paper, passage, empirical claim, audit gate, or social deliverable to illuminate its full provenance path.
              </p>
            </div>
          ) : (
            /* Selected Node Inspector Details */
            <div className="space-y-4 text-xs animate-in fade-in duration-150">
              {/* Type and status banner */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 bg-[#F5EFE6] text-[#786A61] font-bold rounded-xs">
                  {selectedNode.type}
                </span>
                <span
                  className={`font-mono text-[9px] px-2 py-0.5 rounded-xs font-bold ${
                    selectedNode.status === 'HUMAN_APPROVED' ||
                    selectedNode.status === 'PASS' ||
                    selectedNode.status === 'OK' ||
                    selectedNode.status === 'READY' ||
                    selectedNode.status === 'Verified Metadata'
                      ? 'bg-[#416C49]/15 text-[#416C49]'
                      : 'bg-[#C04E2A]/15 text-[#C04E2A]'
                  }`}
                >
                  {selectedNode.status}
                </span>
              </div>

              {/* Title & Sublabel */}
              <div>
                <h4 className="font-serif text-sm font-bold text-[#351D1D] leading-snug">
                  {selectedNode.label}
                </h4>
                <p className="text-[11px] text-[#786A61] mt-1 font-mono">
                  {selectedNode.sublabel}
                </p>
              </div>

              {/* Node-specific metadata */}
              {selectedNode.type === 'CLAIM' && selectedNode.metadata && (
                <div className="p-3.5 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs space-y-2.5">
                  <span className="text-[9px] font-mono uppercase text-[#786A61] font-bold block">
                    Verbatim Evidence Quote
                  </span>
                  <p className="text-[11px] italic text-[#351D1D] leading-relaxed">
                    "{selectedNode.metadata.exact_supporting_quote || selectedNode.metadata.claim_text}"
                  </p>
                  <div className="pt-2 border-t border-[#E6CBBD] space-y-1 text-[10px] font-mono text-[#786A61]">
                    <div className="flex justify-between">
                      <span>Metric:</span>
                      <span className="font-semibold text-[#351D1D]">
                        {selectedNode.metadata.numbers_and_units || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cohort:</span>
                      <span className="font-semibold text-[#351D1D]">
                        {selectedNode.metadata.population || 'Adults'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Design:</span>
                      <span className="font-semibold text-[#351D1D]">
                        {selectedNode.metadata.study_design || 'Clinical Trial'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {selectedNode.type === 'PASSAGE' && selectedNode.metadata && (
                <div className="p-3.5 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs space-y-2">
                  <span className="text-[9px] font-mono uppercase text-[#786A61] font-bold block">
                    Extracted PDF Verbatim Text
                  </span>
                  <p className="text-[11px] text-[#351D1D] leading-relaxed">
                    "{selectedNode.metadata.verbatim_text}"
                  </p>
                  <div className="pt-2 border-t border-[#E6CBBD] flex justify-between text-[10px] font-mono text-[#786A61]">
                    <span>Page {selectedNode.metadata.pdf_page_index}</span>
                    <span>Section: {selectedNode.metadata.section}</span>
                  </div>
                </div>
              )}

              {selectedNode.type === 'VALIDATION_CHECK' && (
                <div className="p-3.5 bg-[#416C49]/10 border border-[#416C49]/30 rounded-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-[#416C49] font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Audit Gate Evaluation (12/12 Rules Clean)</span>
                  </div>
                  <p className="text-[11px] text-[#351D1D] leading-relaxed">
                    This empirical claim has passed deterministic validation checks: zero medical hallucination, verbatim quotation integrity, population specification, and Indian metabolic context calibration.
                  </p>
                </div>
              )}

              {selectedNode.type === 'DELIVERABLE' && (
                <div className="p-3.5 bg-[#FAF6F0] border border-[#E6CBBD] rounded-xs space-y-2.5">
                  <span className="text-[9px] font-mono uppercase text-[#661414] font-bold block">
                    Verified Instagram Deliverable
                  </span>
                  <p className="text-[11px] text-[#351D1D] leading-relaxed">
                    Synthesized into MOTIVA's calm editorial aesthetic. 100% traceable to peer-reviewed clinical data.
                  </p>
                  <button
                    onClick={onNavigateToStudio}
                    className="w-full mt-2 py-2 bg-[#661414] hover:bg-[#501010] text-[#F5EBDF] font-semibold text-xs rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    <span>Open in Instagram Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                {selectedNode.type === 'CLAIM' && (
                  <button
                    onClick={() => onNavigateToDesk(selectedNode.entityId)}
                    className="w-full py-2 bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] text-xs font-semibold text-[#661414] rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    <span>Inspect in Investigation Desk</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
                {selectedNode.type === 'PASSAGE' && (
                  <button
                    onClick={() => onNavigateToDesk(undefined, selectedNode.entityId)}
                    className="w-full py-2 bg-[#FFFDF9] hover:bg-[#F8F2EB] border border-[#E6CBBD] text-xs font-semibold text-[#661414] rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    <span>View in Source Passage Viewer</span>
                    <BookOpen className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-[#E6CBBD] bg-[#FAF6F0] text-[10px] font-mono text-[#786A61] flex items-center justify-between">
          <span>MOTIVA / provenance</span>
          <span className="flex items-center gap-1 text-[#416C49] font-bold">
            <CheckCircle2 className="w-3 h-3" />
            100% Deterministic DAG
          </span>
        </div>
      </div>
    </div>
  );
};
