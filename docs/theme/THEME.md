# Black and White Theme Implementation

## Overview

As of February 2025, we have transitioned to a minimalist black and white color scheme. This document outlines the key aspects of the new theme and serves as a guide for maintaining consistency across the application.

## Core Color Variables

```css
/* Primary Colors */
--text-primary: #FFFFFF;          /* Pure white for primary text */
--text-secondary: #808080;        /* Mid-gray for secondary text */
--background-start-rgb: 0, 0, 0;  /* Pure black background start */
--background-end-rgb: 8, 8, 8;    /* Slightly lighter black background end */

/* UI Elements */
--border-color: rgba(255, 255, 255, 0.1);        /* White with 10% opacity for borders */
--highlight-color: rgba(255, 255, 255, 0.2);      /* White with 20% opacity for highlights */
--accent-color: rgba(255, 255, 255, 0.1);         /* White with 10% opacity for accents */
--panel-bg: rgba(0, 0, 0, 0.7);                   /* Black with 70% opacity for panels */
```

## Design Principles

1. **Minimalism**: Use white elements with varying opacity levels instead of different colors
2. **Contrast**: Maintain readability with careful opacity management
3. **Subtlety**: Employ subtle animations and transitions that don't rely on color
4. **Consistency**: Use standardized opacity levels across similar elements

## Opacity Guidelines

- **Text**:
  - Primary: 100% white
  - Secondary: 50% white
  - Disabled: 30% white
- **Borders**: 10% white
- **Highlights**: 20% white
- **Backgrounds**: 70-90% black
- **Hover States**: Increase opacity by 10-20%

## Animation Guidelines

- Use opacity transitions instead of color changes
- Maintain subtle glow effects using white with low opacity
- Keep animations minimal and purposeful

## Implementation Notes

1. All colored elements have been replaced with grayscale equivalents
2. Red accent colors have been removed in favor of white with varying opacity
3. Charts and graphs use white with opacity for differentiation
4. Shadows and glows use black or white with appropriate opacity

## Component-Specific Changes

### Task Graph

```css
.task-node {
  fill: #FFFFFF;
  fill-opacity: 0.2;
  stroke: #FFFFFF;
  stroke-opacity: 0.3;
}

.task-connection {
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 1;
}
```

### Charts

```css
.recharts-cartesian-grid-horizontal line {
  stroke: rgba(255, 255, 255, 0.05) !important;
}

.recharts-legend-wrapper {
  background: rgba(0, 0, 0, 0.5) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}
```

## Migration Guide

When updating existing components:

1. Replace any color values with appropriate white/black + opacity
2. Update hover states to use opacity changes instead of color changes
3. Ensure text remains readable with proper contrast
4. Use variables from `:root` for consistency

## Testing

- Verify contrast ratios meet accessibility standards
- Test hover states and animations
- Ensure readability across different screen sizes
- Check component states (active, hover, disabled)

## Future Considerations

- Maintain strict adherence to black and white palette
- Consider accessibility implications
- Document any necessary exceptions
- Regular theme audit to ensure consistency

## Questions & Support

For questions about theme implementation, contact the Visual Engineering team.
