import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';

interface KnowledgeNode {
  id: string;
  label: string;
  type: 'task' | 'memory' | 'documentation';
  path: string;
  category: string;
}

interface KnowledgeLink {
  source: string;
  target: string;
  type: 'title_mention' | 'path_reference' | 'task_reference' | 'memory_reference';
  confidence: number;
}

interface ReferenceData {
  source: string;
  target: string;
  type: string;
  confidence: number;
}

interface GraphApiResponse {
  documents: any[];
  references: {
    [key: string]: ReferenceData[];
  };
}

interface KnowledgeGraphData {
  nodes: KnowledgeNode[];
  links: KnowledgeLink[];
}

const KnowledgeGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<KnowledgeGraphData>({
    nodes: [],
    links: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchGraphData() {
      try {
        const response = await fetch('/api/graph');
        if (!response.ok) {
          throw new Error('Failed to fetch graph data');
        }
        
        const rawData = await response.json() as GraphApiResponse;
        
        // Transform documents into graph structure
        const nodes: KnowledgeNode[] = [];
        const links: KnowledgeLink[] = [];
        const nodeMap = new Map<string, boolean>();

        // Process documents into nodes
        rawData.documents.forEach((doc: any) => {
          if (!nodeMap.has(doc.id)) {
            // Determine node type based on path
            let type: KnowledgeNode['type'] = 'documentation';
            let category = 'other';

            if (doc.path.includes('/tasks/')) {
              type = 'task';
              category = doc.path.includes('/active-tasks/') ? 'active' : 
                        doc.path.includes('/completed-tasks/') ? 'completed' : 'unresolved';
            } else if (doc.path.includes('/memories/')) {
              type = 'memory';
              category = doc.path.split('/memories/')[1].split('/')[0];
            }

            nodes.push({
              id: doc.id,
              label: doc.title,
              type,
              path: doc.path,
              category
            });
            nodeMap.set(doc.id, true);
          }
        });

        // Process references into links
        Object.entries(rawData.references).forEach(([type, refs]) => {
          refs.forEach((ref: ReferenceData) => {
            links.push({
              source: ref.source,
              target: ref.target,
              type: type as KnowledgeLink['type'],
              confidence: ref.confidence
            });
          });
        });

        setData({ nodes, links });
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }

    fetchGraphData();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear previous content
    svg.selectAll('*').remove();

    // Filter nodes and links based on selection
    const filteredNodes = filter === 'all' 
      ? data.nodes 
      : data.nodes.filter(n => n.type === filter);
    
    const filteredLinks = data.links.filter(link => 
      filteredNodes.some(n => n.id === link.source) && 
      filteredNodes.some(n => n.id === link.target)
    );

    // Create force simulation
    const simulation = d3.forceSimulation(filteredNodes as any)
      .force('link', d3.forceLink(filteredLinks).id((d: any) => d.id))
      .force('charge', d3.forceManyBody().strength(-150))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));

    // Create container for zoom
    const container = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 2])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });
    svg.call(zoom as any);

    // Create links
    const links = container.append('g')
      .selectAll('line')
      .data(filteredLinks)
      .join('line')
      .attr('class', 'knowledge-connection')
      .attr('stroke', (d: KnowledgeLink) => {
        switch (d.type) {
          case 'title_mention': return 'rgba(255,255,255,0.4)';
          case 'path_reference': return 'rgba(255,255,255,0.3)';
          case 'task_reference': return 'rgba(255,255,255,0.6)';
          case 'memory_reference': return 'rgba(255,255,255,0.5)';
          default: return 'rgba(255,255,255,0.2)';
        }
      })
      .attr('stroke-width', (d: KnowledgeLink) => d.confidence * 2)
      .attr('stroke-opacity', (d: KnowledgeLink) => d.confidence);

    // Create nodes
    const nodes = container.append('g')
      .selectAll('g')
      .data(filteredNodes)
      .join('g')
      .attr('class', 'knowledge-node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any)
      .on('click', (event: any, d: KnowledgeNode) => {
        setSelectedNode(selectedNode === d.id ? null : d.id);
      });

    // Add circles to nodes
    nodes.append('circle')
      .attr('r', 25)
      .attr('fill', (d: KnowledgeNode) => getNodeColor(d))
      .attr('stroke', (d: KnowledgeNode) => 
        selectedNode === d.id ? '#FFFFFF' : 'rgba(255,255,255,0.2)')
      .attr('stroke-width', (d: KnowledgeNode) => 
        selectedNode === d.id ? 2 : 1);

    // Add labels to nodes
    nodes.append('text')
      .text((d: KnowledgeNode) => d.label)
      .attr('dy', 35)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-xs text-white opacity-70')
      .style('pointer-events', 'none');

    // Add type indicators
    nodes.append('text')
      .text((d: KnowledgeNode) => getNodeIcon(d))
      .attr('dy', 5)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-sm text-white')
      .style('pointer-events', 'none');

    // Update positions on simulation tick
    simulation.on('tick', () => {
      links
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodes.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data, selectedNode, filter]);

  const getNodeColor = (node: KnowledgeNode) => {
    switch (node.type) {
      case 'task':
        switch (node.category) {
          case 'active': return 'rgba(74, 222, 128, 0.3)';
          case 'completed': return 'rgba(34, 197, 94, 0.3)';
          default: return 'rgba(239, 68, 68, 0.3)';
        }
      case 'memory':
        return 'rgba(59, 130, 246, 0.3)';
      default:
        return 'rgba(255, 255, 255, 0.2)';
    }
  };

  const getNodeIcon = (node: KnowledgeNode) => {
    switch (node.type) {
      case 'task': return '⚡';
      case 'memory': return '💭';
      default: return '📄';
    }
  };

  if (loading) {
    return (
      <div className="knowledge-graph flex items-center justify-center">
        <span className="text-sm text-white/50">Loading knowledge graph...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="knowledge-graph flex items-center justify-center">
        <span className="text-sm text-red-500">{error}</span>
      </div>
    );
  }

  return (
    <div className="knowledge-graph">
      <div className="knowledge-graph-header flex justify-between items-center p-4">
        <h2 className="text-sm font-mono uppercase tracking-wider text-white/70">Knowledge Graph</h2>
        <div className="flex items-center space-x-4">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white/70"
          >
            <option value="all">All Documents</option>
            <option value="task">Tasks</option>
            <option value="memory">Memories</option>
            <option value="documentation">Documentation</option>
          </select>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-white/50">{data.nodes.length} Nodes</span>
            <span className="text-xs text-white/50">{data.links.length} Links</span>
          </div>
        </div>
      </div>
      
      <div className="knowledge-graph-content relative flex-1">
        <svg ref={svgRef} className="w-full h-full">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
        </svg>

        {selectedNode && (
          <div className="absolute top-4 right-4 bg-black/80 border border-white/10 rounded p-4 max-w-xs">
            <h3 className="text-sm font-mono text-white/90 mb-2">
              {data.nodes.find(n => n.id === selectedNode)?.label}
            </h3>
            <p className="text-xs text-white/70">
              Path: {data.nodes.find(n => n.id === selectedNode)?.path}
            </p>
            <p className="text-xs text-white/70">
              Type: {data.nodes.find(n => n.id === selectedNode)?.type}
            </p>
            <p className="text-xs text-white/70">
              Category: {data.nodes.find(n => n.id === selectedNode)?.category}
            </p>
          </div>
        )}
      </div>

      <div className="knowledge-graph-footer p-4">
        <div className="flex items-center justify-center space-x-6 text-xs text-white/50">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-[rgba(74,222,128,0.3)]"></span>
            <span>Active Tasks</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-[rgba(34,197,94,0.3)]"></span>
            <span>Completed Tasks</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-[rgba(239,68,68,0.3)]"></span>
            <span>Unresolved Tasks</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-[rgba(59,130,246,0.3)]"></span>
            <span>Memories</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-[rgba(255,255,255,0.2)]"></span>
            <span>Documentation</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraph; 