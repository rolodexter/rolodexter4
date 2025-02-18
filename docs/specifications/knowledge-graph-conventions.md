# Knowledge Graph Conventions and Standards

## Visual Design System

### Node Styling Specifications

#### Size Convention

- **Base Size**: 15px (constant)
- **Growth Factor**: Moderate logarithmic scaling using `Math.pow((connectionCount - threshold) / threshold, 0.8)`
- **Maximum Scale**: Base * 1.2 for highly connected nodes
- **Standard Scale**: Linear scaling up to 30% increase for normal nodes
- **Rationale**: Maintain visual hierarchy while avoiding overwhelming size differences

#### Color System (Grayscale)

- **Base Value**: 220 (light gray)
- **Darkening Range**: 60-100 units
- **Minimum Brightness**: 120 (ensures readability)
- **Formula**: `intensity = Math.max(220 - darkenAmount, 120)`
- **Scaling**: 
  - Regular nodes: Linear darkening up to 60 units
  - Highly connected nodes (80th percentile+): Additional darkening up to 40 units with 0.8 power curve
- **Color Application**: `rgb(intensity, intensity, intensity)`

### Node Types and Shapes

1. **Documents**
   - Shape: Circle
   - Purpose: Primary content nodes
   - Visual Priority: High

2. **Tags**
   - Shape: Hexagon (future implementation)
   - Purpose: Categorization and grouping
   - Visual Priority: Medium

3. **Status**
   - Shape: Diamond (future implementation)
   - Purpose: State and progress indicators
   - Visual Priority: Medium

### Interactive Behavior Standards

#### Hover Effects

- Scale: 1.05x original size
- Transition Duration: 400ms
- Timing Function: cubic-bezier(0.4, 0, 0.2, 1)
- Opacity: 1.0 (from 0.9)

#### Connected Elements

- Link Opacity (Connected): 0.9
- Link Opacity (Unconnected): 0.2
- Transition Duration: 400ms

#### Drag Behavior

- Cursor: grab (default), grabbing (active)
- Alpha Target: 0.3 (during drag)
- Force Simulation Adjustment: Restart on drag start

### Labels and Information

- Font Size: 8px
- Position: Dynamic, based on node size
- Offset: node radius + 5px
- Base Opacity: 0.7
- Pointer Events: none

## Implementation Requirements

### Node Connection Calculation

```typescript
const connections = new Map<string, number>();
Object.values(references).flat().forEach(link => {
  const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
  const targetId = typeof link.target === 'string' ? link.target : link.target.id;
  connections.set(sourceId, (connections.get(sourceId) || 0) + 1);
  connections.set(targetId, (connections.get(targetId) || 0) + 1);
});
```

### Required Styling Functions

```typescript
const getNodeSize = (nodeId: string) => {
  const connectionCount = connections.get(nodeId) || 0;
  const baseSize = 15;
  const threshold = 10; // Example threshold value
  if (connectionCount > threshold) {
    return baseSize * Math.min(1.2, Math.pow((connectionCount - threshold) / threshold, 0.8));
  }
  return baseSize * (1 + Math.log1p(connectionCount) * 0.3);
};

const getNodeColor = (nodeId: string) => {
  const connectionCount = connections.get(nodeId) || 0;
  const baseValue = 220;
  const darkenAmount = Math.min(connectionCount * 15, 80);
  const intensity = Math.max(baseValue - darkenAmount, 120);
  return `rgb(${intensity}, ${intensity}, ${intensity})`;
};
```

## Performance Considerations

### Node Limits

- Recommended Maximum Nodes: 1000
- Recommended Maximum Links: 2000
- Performance Degradation: Monitor frame rate when exceeding limits

### Optimization Techniques

1. Use requestAnimationFrame for smooth animations
2. Implement node culling for off-screen elements
3. Batch DOM updates during force simulation ticks
4. Use transform instead of direct attribute updates when possible

## Maintenance Guidelines

### Adding New Node Types

1. Define shape constants
2. Update type definitions
3. Add visual styling rules
4. Document in this specification

### Modifying Existing Behavior

1. Update this specification
2. Add migration notes if breaking
3. Update all related comments in code
4. Test performance impact

### Testing Requirements

1. Visual consistency across node states
2. Performance with maximum recommended nodes
3. Interaction responsiveness
4. Cross-browser compatibility
