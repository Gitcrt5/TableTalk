import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, MapPin, ChevronRight } from "lucide-react";

/**
 * RecentGamesDashboard (modern)
 * Modern, responsive dashboard module to display a user's most recent bridge games.
 * Adds partner, responsive mobile cards, quick search, and subtle affordances.
 *
 * Visible fields: name, date, partner, club. Sorted by date desc. Limit configurable.
 *
 * Props
 * - games: Array<{ id: string|number, name: string, date: string|Date, partner?: string, club: string }>
 * - limit?: number (default 10)
 * - title?: string (default "Recent Games")
 * - onRowClick?: (game) => void
 */

function formatDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(date);
}

function sortByDateDesc(a, b) {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

function useSearch(items, q, keys) {
  if (!q) return items;
  const needle = q.toLowerCase();
  return items.filter(it => keys.some(k => String(it[k] ?? "").toLowerCase().includes(needle)));
}

export default function RecentGamesDashboard({ games = SAMPLE_GAMES, limit = 10, title = "Recent Games", onRowClick }) {
  const [query, setQuery] = React.useState("");

  const sorted = React.useMemo(() => [...games].sort(sortByDateDesc), [games]);
  const filtered = useSearch(sorted, query, ["name", "club", "partner"]);
  const rows = filtered.slice(0, limit);

  return (
    <section className="w-full">
      <Card className="shadow-sm border-none bg-gradient-to-b from-background to-muted/30">
        <CardHeader className="gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl tracking-tight">{title}</CardTitle>
              <p className="text-sm text-muted-foreground">Most recent first. Showing name, date, partner, and club.</p>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex whitespace-nowrap">{rows.length} shown</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search by name, partner, or club"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="max-w-xs"
            />
            <div className="ml-auto" />
            <Button variant="ghost" size="sm">View all</Button>
          </div>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="rounded-2xl border hidden md:block overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[35%]">Name</TableHead>
                    <TableHead className="w-[20%]">Date</TableHead>
                    <TableHead className="w-[25%]">Partner</TableHead>
                    <TableHead>Club</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(g => (
                    <TableRow
                      key={g.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => onRowClick?.(g)}
                    >
                      <TableCell className="font-medium">{g.name}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(g.date)}</TableCell>
                      <TableCell>{g.partner ?? "—"}</TableCell>
                      <TableCell>{g.club}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Mobile cards */}
          <div className="md:hidden grid gap-3">
            {rows.map(g => (
              <button
                key={g.id}
                onClick={() => onRowClick?.(g)}
                className="text-left rounded-2xl border p-4 bg-card hover:bg-muted/40 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium leading-tight">{g.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                      <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(g.date)}</span>
                      <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {g.partner ?? "—"}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {g.club}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-3xl">🃏</div>
      <p className="mt-2 text-sm text-muted-foreground">No games to display yet.</p>
      <p className="text-sm text-muted-foreground">Create your first game to get started.</p>
      <div className="mt-4">
        <Button size="sm">New game</Button>
      </div>
    </div>
  );
}

// Sample data for local preview and development
const SAMPLE_GAMES = [
  { id: "g-1014", name: "Tuesday Pairs", date: "2025-08-22T19:00:00+10:00", partner: "Zoe R-T", club: "Newcastle Bridge Club" },
  { id: "g-1013", name: "Club Pairs", date: "2025-08-12T19:00:00+10:00", partner: "Sam Lee", club: "Hamilton BC" },
  { id: "g-1012", name: "Winter Teams R3", date: "2025-08-05T18:30:00+10:00", partner: "Alex Chen", club: "Charlestown BC" },
  { id: "g-1011", name: "Friday Social", date: "2025-08-01", partner: "Pat Singh", club: "Merewether BC" },
  { id: "g-1010", name: "Swiss Pairs", date: "2025-07-27T13:00:00+10:00", partner: "Jamie Park", club: "Hunter Regional" },
  { id: "g-1009", name: "Thursday Duplicate", date: "2025-07-24", partner: null, club: "Newcastle Bridge Club" },
];
