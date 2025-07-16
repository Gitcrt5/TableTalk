import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BiddingTableProps {
  title: string;
  bidding: string[];
  finalContract?: string;
  declarer?: string;
  icon?: string;
}

export default function BiddingTable({ 
  title, 
  bidding, 
  finalContract, 
  declarer, 
  icon = "gavel" 
}: BiddingTableProps) {
  
  // Group bidding into rounds of 4
  const biddingRounds = [];
  if (bidding && bidding.length > 0) {
    for (let i = 0; i < bidding.length; i += 4) {
      biddingRounds.push(bidding.slice(i, i + 4));
    }
  }

  const formatBid = (bid: string) => {
    if (!bid || bid === "Pass" || bid === "-") return bid;
    
    // Handle special bids that shouldn't be converted
    if (bid === "Double" || bid === "Redouble") return bid;
    
    // Handle bids like "1NT", "4♠", etc.
    if (bid.includes('♠') || bid.includes('♥') || bid.includes('♦') || bid.includes('♣')) {
      return bid;
    }
    
    // Convert suit letters to symbols while preserving X/XX annotations
    let formattedBid = bid.replace(/(\d)([SHDC])(X*)/g, (match, level, suit, doubleMarker) => {
      const suitSymbol = suit === 'S' ? '♠' : suit === 'H' ? '♥' : suit === 'D' ? '♦' : suit === 'C' ? '♣' : suit;
      return level + suitSymbol + doubleMarker;
    });
    
    // Handle NT with X/XX
    formattedBid = formattedBid.replace(/(\d)NT(X*)/g, '$1NT$2');
    
    return formattedBid;
  };

  // Get the appropriate color class for a bid
  const getBidColor = (bid: string) => {
    if (bid.includes("♣") || bid.includes("♠")) return "text-black";
    if (bid.includes("♥") || bid.includes("♦")) return "text-red-600"; // Both hearts and diamonds red
    if (bid.includes("NT")) return "text-blue-700";
    if (bid === "Double" || bid === "Redouble") return "text-red-600";
    return "text-gray-700"; // For Pass
  };

  return (
    <Card className="bg-gray-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <i className={`fas fa-${icon} text-accent`} />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm bridge-hand">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2">West</th>
                <th className="text-left py-2">North</th>
                <th className="text-left py-2">East</th>
                <th className="text-left py-2">South</th>
              </tr>
            </thead>
            <tbody>
              {biddingRounds.map((round, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className={`py-2 ${getBidColor(formatBid(round[0]) || '')}`}>
                    {formatBid(round[0]) || '-'}
                  </td>
                  <td className={`py-2 ${getBidColor(formatBid(round[1]) || '')}`}>
                    {formatBid(round[1]) || '-'}
                  </td>
                  <td className={`py-2 ${getBidColor(formatBid(round[2]) || '')}`}>
                    {formatBid(round[2]) || '-'}
                  </td>
                  <td className={`py-2 ${getBidColor(formatBid(round[3]) || '')}`}>
                    {formatBid(round[3]) || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {finalContract && (
          <Card className="mt-4 bg-white">
            <CardContent className="p-3">
              <div className="text-sm text-text-secondary">Final Contract:</div>
              <div className={`font-semibold text-lg ${getBidColor(formatBid(finalContract))}`}>
                {formatBid(finalContract)} {declarer ? `by ${declarer}` : ''}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
