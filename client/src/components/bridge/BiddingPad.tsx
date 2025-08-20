import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SuitSymbol } from "./SuitSymbol";
import { Bid, Direction } from "@shared/schema";

interface BiddingPadProps {
  currentBidder: Direction;
  onBid: (bid: Bid) => void;
  onUndo: () => void;
  onClear: () => void;
  disabled?: boolean;
}

export const BiddingPad = ({ currentBidder, onBid, onUndo, onClear, disabled = false }: BiddingPadProps) => {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  const levels = [1, 2, 3, 4, 5, 6, 7];
  const suits = ["C", "D", "H", "S", "NT"] as const;

  const handleBid = (level: number, suit: typeof suits[number]) => {
    onBid({
      level,
      suit: suit as any,
      call: "BID",
      player: currentBidder,
    });
    setSelectedLevel(null);
  };

  const handlePass = () => {
    onBid({
      call: "PASS",
      player: currentBidder,
    });
  };

  const handleDouble = () => {
    onBid({
      call: "DOUBLE",
      player: currentBidder,
    });
  };

  const handleRedouble = () => {
    onBid({
      call: "REDOUBLE",
      player: currentBidder,
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Current bidder: <span className="font-medium">{currentBidder}</span>
      </div>

      {/* Level selection */}
      <div className="grid grid-cols-8 gap-2">
        {levels.map(level => (
          <Button
            key={level}
            variant={selectedLevel === level ? "default" : "outline"}
            size="sm"
            className="aspect-square"
            onClick={() => setSelectedLevel(level)}
            disabled={disabled}
          >
            {level}
          </Button>
        ))}
        <Button
          variant={selectedLevel === 0 ? "default" : "outline"}
          size="sm"
          className="aspect-square text-xs text-green-600"
          onClick={() => setSelectedLevel(0)}
          disabled={disabled}
        >
          NT
        </Button>
      </div>

      {/* Suit selection */}
      {selectedLevel !== null && (
        <div className="grid grid-cols-5 gap-2">
          {suits.map(suit => (
            <Button
              key={suit}
              variant="outline"
              size="sm"
              className="aspect-square"
              onClick={() => selectedLevel > 0 ? handleBid(selectedLevel, suit) : handleBid(selectedLevel || 7, "NT")}
              disabled={disabled}
            >
              <SuitSymbol suit={suit} />
            </Button>
          ))}
        </div>
      )}

      {/* Special calls */}
      <div className="grid grid-cols-4 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePass}
          disabled={disabled}
        >
          Pass
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDouble}
          disabled={disabled}
        >
          X
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRedouble}
          disabled={disabled}
        >
          XX
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onUndo}
          disabled={disabled}
        >
          Undo
        </Button>
      </div>

      <Button
        variant="destructive"
        size="sm"
        onClick={onClear}
        disabled={disabled}
        className="w-full"
      >
        Clear
      </Button>
    </div>
  );
};
