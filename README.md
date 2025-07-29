# Process Map Demo - Standalone React Component

A standalone, interactive process map component built with React, ReactFlow, and TypeScript. This component provides a visual representation of workflow processes across different phases, originally extracted from a larger case management system.

## Features

- **Interactive Process Visualization**: Visual workflow representation using ReactFlow
- **Phase-based Organization**: Items organized across configurable process phases
- **Search & Filtering**: Real-time search through workflow items
- **Case-based Filtering**: Filter workflows by specific cases
- **Multiple View Modes**: 
  - Process Map focused view
  - Workflow List focused view
  - Balanced view
- **Responsive Design**: Works on different screen sizes
- **Custom Node Types**: Support for different workflow node types (start/end, process, decision)
- **Drag & Drop**: Interactive node positioning
- **Workflow Details**: Click items to view detailed workflow information

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **ReactFlow** - Interactive node-based diagrams
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── components/
│   ├── process-map/
│   │   ├── custom-nodes.tsx          # ReactFlow custom node components
│   │   ├── process-map.tsx           # Main process map component
│   │   ├── process-map-container.tsx # Container with sidebar
│   │   ├── process-map-sidebar.tsx   # Sidebar with controls
│   │   └── process-map-view.tsx      # Complete view with sample data
│   └── ui/
│       ├── badge.tsx                 # Badge component
│       ├── button.tsx                # Button component
│       ├── input.tsx                 # Input component
│       └── select.tsx                # Select dropdown component
├── stores/
│   └── process-map-store.ts          # Zustand store for state management
├── types/
│   ├── process-map.ts                # Process map type definitions
│   └── workflow.ts                   # Workflow type definitions
├── lib/
│   └── utils.ts                      # Utility functions
└── styles.css                        # Global styles and Tailwind imports
```

## Usage

### Basic Usage

```tsx
import { ProcessMapView } from './components/process-map/process-map-view';

function App() {
  return (
    <div style={{ height: '100vh' }}>
      <ProcessMapView frameworkId="my-framework" />
    </div>
  );
}
```

### Custom Implementation

```tsx
import { ProcessMapContainer } from './components/process-map/process-map-container';
import { ProcessPhase, WorkflowItem } from './types/process-map';

const customPhases: ProcessPhase[] = [
  {
    id: "phase1",
    label: "Planning",
    x: 0,
    width: 300,
    color: "from-blue-50 to-blue-100"
  },
  // ... more phases
];

const customItems: WorkflowItem[] = [
  {
    id: "item1",
    title: "Initial Planning",
    description: "Start the planning process",
    phaseId: "phase1",
    category: "planning",
    isActive: true
  },
  // ... more items
];

function CustomProcessMap() {
  return (
    <ProcessMapContainer
      phases={customPhases}
      items={customItems}
      onItemClick={(item) => console.log('Clicked:', item)}
    />
  );
}
```

## Customization

### Adding New Phases

Modify the `phases` array in `process-map-view.tsx`:

```tsx
const phases: ProcessPhase[] = [
  {
    id: "new-phase",
    label: "NEW PHASE",
    x: 1280, // Position from left
    width: 200, // Width in pixels
    color: "from-purple-50 to-purple-100" // Tailwind gradient
  }
];
```

### Adding New Workflow Items

Add items to the sample data or connect to your own data source:

```tsx
const newWorkflow = {
  id: "workflow-new",
  name: "New Workflow",
  description: "Description of the new workflow",
  category: "custom",
  status: "active",
  nodes: [
    {
      id: "start-new",
      type: "startNode",
      position: { x: 0, y: 0 },
      data: { label: "Start New Process", phase: "request-service" }
    }
  ],
  edges: []
};
```

### Custom Node Types

Extend the `nodeTypes` in `custom-nodes.tsx`:

```tsx
export const nodeTypes: NodeTypes = {
  process: CustomNode,
  decision: CustomNode,
  startEnd: CustomNode,
  customType: CustomNode, // Add your custom type
};
```

### Styling

The component uses Tailwind CSS. Customize colors and styles by:

1. Modifying the Tailwind config in `tailwind.config.js`
2. Adding custom CSS classes in `styles.css`
3. Updating component-specific styles in individual components

## State Management

The component uses Zustand for state management. Key state includes:

- `nodes` & `edges`: ReactFlow diagram state
- `searchTerm`: Current search filter
- `selectedCaseId`: Selected case filter
- `expandedView`: Current view mode
- `items`: Process map items
- `selectedItemId`: Currently selected item

Access the store in any component:

```tsx
import { useProcessMapStore } from '../stores/process-map-store';

function MyComponent() {
  const { searchTerm, setSearchTerm } = useProcessMapStore();
  // ... use state
}
```

## Data Integration

To integrate with your own data source:

1. Replace the sample data in `process-map-view.tsx`
2. Implement data fetching (REST API, GraphQL, etc.)
3. Map your data to the `WorkflowItem` and `ProcessPhase` interfaces
4. Handle loading and error states

Example with async data:

```tsx
function ProcessMapView() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/workflows');
        const data = await response.json();
        const mappedWorkflows = data.map(mapToWorkflowItem);
        setWorkflows(mappedWorkflows);
      } catch (error) {
        console.error('Failed to load workflows:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return <ProcessMapContainer items={workflows} phases={phases} />;
}
```

## Performance Considerations

- The component is optimized for up to ~100 workflow items
- For larger datasets, consider implementing:
  - Virtual scrolling for the phase columns
  - Pagination or infinite scroll
  - Debounced search
  - Memoization of expensive calculations

## Browser Support

- Modern browsers with ES2018+ support
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is provided as-is for demonstration purposes. Feel free to use and modify as needed for your projects.

## Credits

- Built with [ReactFlow](https://reactflow.dev/) for the interactive diagrams
- Icons by [Lucide](https://lucide.dev/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
- Originally extracted from a larger case management system

## Troubleshooting

### Common Issues

1. **Styles not loading**: Make sure Tailwind CSS is properly configured and imported
2. **ReactFlow errors**: Ensure the component is wrapped in `ReactFlowProvider`
3. **TypeScript errors**: Check that all types are properly imported and defined
4. **Performance issues**: Consider reducing the number of items or implementing pagination

### Development

For development debugging:

```bash
# Run with verbose logging
REACT_APP_DEBUG=true npm start

# Check bundle size
npm run build
npx serve -s build
```

## Support

For issues and questions:
1. Check the console for any error messages
2. Verify that all dependencies are properly installed
3. Ensure your data matches the expected interfaces
4. Check the React and ReactFlow documentation for advanced usage

## Summary

This standalone process map component provides a complete, interactive workflow visualization solution that can be easily integrated into any React application. Key highlights:

- **Zero External Dependencies**: All analytics, feature flags, and external services removed
- **Fully Self-Contained**: Complete with sample data and mock functionality
- **Production Ready**: TypeScript, proper error handling, and responsive design
- **Highly Customizable**: Easy to modify phases, workflows, and styling
- **Modern Stack**: React 18, ReactFlow, Zustand, and Tailwind CSS

The component successfully demonstrates enterprise-grade workflow visualization capabilities while remaining lightweight and easy to integrate. Perfect for case management systems, business process modeling, or any application requiring interactive process visualization.

**Next Steps**: Customize the sample data, integrate with your backend API, and adapt the styling to match your application's design system.