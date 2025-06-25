import { Card, CardContent } from "@/components/ui/card";
import type { Hand } from "@shared/schema";
import { formatSuitSymbol } from "@/lib/bridge-utils";

interface HandDisplayProps {
  hand: Hand;
}

export default function HandDisplay({ hand }: HandDisplayProps) {
  const renderSuit = (suitString: string) => {
    if (!suitString) return null;
    
    const parts = suitString.split(' ');
    return parts.map((part, index) => {
      if (!part) return null;
      
      const symbol = part[0];
      const cards = part.slice(1);
      
      return (
        <div key={index} className="flex items-center justify-center space-x-1">
          <span className={`suit-${formatSuitSymbol(symbol).toLowerCase()}`}>
            {formatSuitSymbol(symbol)}
          </span>
          <span>{cards}</span>
        </div>
      );
    });
  };

  const renderHandContent = (handString: string, position: string) => (
    <Card className="bg-gray-50">
      <CardContent className="p-4">
        <div className="text-center">
          <h4 className="font-semibold mb-3 text-sm">{position}</h4>
          <div className="space-y-2 text-sm bridge-hand">
            {renderSuit(handString)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-3 gap-4" style={{
      gridTemplateAreas: `
        ". north ."
        "west center east"
        ". south ."
      `
    }}>
      {/* North Hand */}
      <div style={{ gridArea: 'north' }}>
        {renderHandContent(hand.northHand, 'NORTH')}
      </div>

      {/* West Hand */}
      <div style={{ gridArea: 'west' }}>
        {renderHandContent(hand.westHand, 'WEST')}
      </div>

      {/* Center Info */}
      <div style={{ gridArea: 'center' }} className="flex flex-col justify-center items-center">
        <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center mb-2">
          <i className="fas fa-bridge text-xl" />
        </div>
        <div className="text-center text-sm">
          <div className="font-semibold">Dealer: {hand.dealer}</div>
          <div className="text-text-secondary">Vulnerable: {hand.vulnerability}</div>
        </div>
      </div>

      {/* East Hand */}
      <div style={{ gridArea: 'east' }}>
        {renderHandContent(hand.eastHand, 'EAST')}
      </div>

      {/* South Hand */}
      <div style={{ gridArea: 'south' }}>
        {renderHandContent(hand.southHand, 'SOUTH')}
      </div>
    </div>
  );
}
