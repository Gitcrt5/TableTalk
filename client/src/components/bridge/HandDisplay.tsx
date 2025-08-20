import { BridgeHand } from "@shared/schema";
import { SuitSymbol } from "./SuitSymbol";

interface HandDisplayProps {
  hand: BridgeHand;
  position: "N" | "E" | "S" | "W";
  isUser?: boolean;
}

const HCP_VALUES: Record<string, number> = { A: 4, K: 3, Q: 2, J: 1 };

const calculateHCP = (hand: BridgeHand): number => {
  let total = 0;
  Object.values(hand).forEach(suit => {
    if (suit) {
      for (const card of suit) {
        total += HCP_VALUES[card] || 0;
      }
    }
  });
  return total;
};

export const HandDisplay = ({ hand, position, isUser = false }: HandDisplayProps) => {
  const hcp = calculateHCP(hand);
  
  return (
    <div className={`rounded-lg border p-4 ${isUser ? 'border-2 border-bridge-blue bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="text-center mb-2">
        <div className="font-medium">
          {position === "N" && "North"}
          {position === "E" && "East"}
          {position === "S" && "South"}
          {position === "W" && "West"}
          {isUser && " (You)"}
        </div>
        <div className="text-xs text-gray-500">HCP: {hcp}</div>
      </div>
      <div className="space-y-1 text-sm font-mono">
        <div>
          <SuitSymbol suit="S" /> {hand.S || "—"}
        </div>
        <div>
          <SuitSymbol suit="H" /> {hand.H || "—"}
        </div>
        <div>
          <SuitSymbol suit="D" /> {hand.D || "—"}
        </div>
        <div>
          <SuitSymbol suit="C" /> {hand.C || "—"}
        </div>
      </div>
    </div>
  );
};
