import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Hand } from "@shared/schema";

interface HandDisplayProps {
  hand: Hand;
}

export default function HandDisplay({ hand }: HandDisplayProps) {
  console.log('HandDisplay received hand:', hand);
  
  const formatHand = (handString: string | null | undefined) => {
    console.log('Formatting hand string:', handString);
    
    if (!handString || typeof handString !== 'string') {
      return <div className="text-sm text-gray-500">No hand data</div>;
    }
    
    const suits = handString.split('.');
    const suitSymbols = ['♠', '♥', '♦', '♣'];
    const suitColors = ['text-black', 'text-red-500', 'text-red-500', 'text-black'];
    
    return suits.map((suit, index) => (
      <div key={index} className="flex items-start space-x-2 mb-1">
        <span className={`font-bold text-lg ${suitColors[index]} min-w-[20px]`}>
          {suitSymbols[index]}
        </span>
        <span className="font-mono text-sm flex-1 leading-relaxed">
          {suit || '—'}
        </span>
      </div>
    ));
  };

  const getPositionBadgeColor = (position: string) => {
    switch (position) {
      case 'North': return 'bg-blue-100 text-blue-800';
      case 'South': return 'bg-green-100 text-green-800';
      case 'East': return 'bg-orange-100 text-orange-800';
      case 'West': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="relative min-h-[400px] w-full">
      {/* North */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-48">
        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="text-center mb-3">
              <Badge className={getPositionBadgeColor('North')}>North</Badge>
            </div>
            <div className="space-y-1">
              {formatHand(hand.northHand)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* West */}
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-48">
        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="text-center mb-3">
              <Badge className={getPositionBadgeColor('West')}>West</Badge>
            </div>
            <div className="space-y-1">
              {formatHand(hand.westHand)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* East */}
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-48">
        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="text-center mb-3">
              <Badge className={getPositionBadgeColor('East')}>East</Badge>
            </div>
            <div className="space-y-1">
              {formatHand(hand.eastHand)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* South */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-48">
        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="text-center mb-3">
              <Badge className={getPositionBadgeColor('South')}>South</Badge>
            </div>
            <div className="space-y-1">
              {formatHand(hand.southHand)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Center information */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <Card className="shadow-lg border-2 border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="space-y-2">
              <div className="text-lg font-semibold text-primary">
                Board {hand.boardNumber}
              </div>
              <div className="text-sm text-text-secondary space-y-1">
                <div>Dealer: <span className="font-semibold">{hand.dealer}</span></div>
                <div>Vulnerability: <span className="font-semibold">{hand.vulnerability}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}