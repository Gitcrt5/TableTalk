interface SuitSymbolProps {
  suit: "S" | "H" | "D" | "C" | "NT";
  className?: string;
}

export const SuitSymbol = ({ suit, className = "" }: SuitSymbolProps) => {
  const getSuitInfo = (suit: string) => {
    switch (suit) {
      case "S":
        return { symbol: "♠", color: "text-black" };
      case "H":
        return { symbol: "♥", color: "text-red-600" };
      case "D":
        return { symbol: "♦", color: "text-red-600" };
      case "C":
        return { symbol: "♣", color: "text-black" };
      case "NT":
        return { symbol: "NT", color: "text-green-600" };
      default:
        return { symbol: "", color: "" };
    }
  };

  const { symbol, color } = getSuitInfo(suit);

  return <span className={`${color} ${className}`}>{symbol}</span>;
};
