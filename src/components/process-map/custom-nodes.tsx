import { Handle, Position, NodeProps, NodeTypes } from "reactflow";
import { cn } from "../../lib/utils";

interface NodeData {
  label: string;
  onClick: (data: NodeData) => void;
  inputs?: { id: string; position: Position }[];
  outputs?: { id: string; position: Position }[];
  sizeMultiplier?: {
    width: number;
    height: number;
  };
}

// and handle dynamic connection points (handles) based on the data provided.
export const CustomNode = ({ data, selected, type }: NodeProps<NodeData>) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onClick?.(data);
  };

  if (type === "decision") {
    const baseSize = 112;

    const widthMultiplier = data.sizeMultiplier?.width ?? 1;
    const heightMultiplier = data.sizeMultiplier?.height ?? 1;

    const width = baseSize * widthMultiplier;
    const height = baseSize * heightMultiplier;

    return (
      <div
        className="relative flex items-center justify-center"
        style={{ width, height }}
        onClick={handleClick}
      >
        {data.inputs?.map((input) => (
          <Handle
            key={input.id}
            type="target"
            position={input.position}
            id={input.id}
            className="!w-3 !h-3 !bg-orange-500"
            // style={{
            //   [input.position]: "-6px",
            // }}
          />
        ))}
        {data.outputs?.map((output) => (
          <Handle
            key={output.id}
            type="source"
            position={output.position}
            id={output.id}
            className="!w-3 !h-3 !bg-orange-500"
            // style={{
            //   [output.position]: "-6px",
            // }}
          />
        ))}
        <div
          className={cn(
            "w-full h-full bg-white border-2 flex items-center justify-center cursor-pointer transition-all duration-200 transform rotate-45",
            selected
              ? "border-orange-500 shadow-lg"
              : "border-gray-300 hover:border-orange-400"
          )}
        >
          <div className="transform -rotate-45 text-xs font-semibold text-center text-gray-800">
            {data.label}
          </div>
        </div>
      </div>
    );
  }

  const baseWidths = {
    process: 176, // w-44
    startEnd: 112, // w-28
  };
  const baseHeights = {
    process: 64, // h-16
    startEnd: 64,
  };

  const widthMultiplier = data.sizeMultiplier?.width ?? 1;
  const heightMultiplier = data.sizeMultiplier?.height ?? 1;

  // Apply dampening only if needed
  const effectiveWidthMultiplier =
    type === "process" || type === "startEnd"
      ? 1 + (widthMultiplier - 1) * 0.5
      : widthMultiplier;

  const effectiveHeightMultiplier =
    type === "process" || type === "startEnd"
      ? 1 + (heightMultiplier - 1) * 0.5
      : heightMultiplier;

  const width =
    (baseWidths[type as keyof typeof baseWidths] ?? 160) *
    effectiveWidthMultiplier;
  const height =
    (baseHeights[type as keyof typeof baseHeights] ?? 64) *
    effectiveHeightMultiplier;

  const nodeClass = cn(
    "shadow-sm rounded-md bg-white border relative cursor-pointer transition-all duration-200 flex items-center justify-center text-xs font-semibold text-center text-gray-800",
    selected && "shadow-lg",
    type === "process" &&
      `${
        selected ? "border-blue-500" : "border-gray-300 hover:border-blue-400"
      }`,
    type === "startEnd" &&
      `rounded-full bg-green-100 text-green-800 ${
        selected
          ? "border-green-500"
          : "border-green-300 hover:border-green-400"
      }`
  );

  return (
    <div className={nodeClass} onClick={handleClick} style={{ width, height }}>
      {data.inputs?.map((input) => (
        <Handle
          key={input.id}
          type="target"
          position={input.position}
          id={input.id}
          className="!w-3 !h-3 !bg-orange-500"
          style={{
            [input.position]: "-6px",
          }}
        />
      ))}
      <div>{data.label}</div>
      {data.outputs?.map((output) => (
        <Handle
          key={output.id}
          type="source"
          position={output.position}
          id={output.id}
          className="w-2 h-2 !bg-gray-500"
        />
      ))}
    </div>
  );
};

// Export the node types map to be used in any React Flow instance
export const nodeTypes: NodeTypes = {
  process: CustomNode,
  decision: CustomNode,
  startEnd: CustomNode,
};
