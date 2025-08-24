import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, MapPin, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { Game, User } from "@shared/schema";

interface GameWithRelations extends Game {
  partner?: User;
  event?: { clubName: string };
}

interface RecentGamesDashboardProps {
  games?: GameWithRelations[];
  limit?: number;
  title?: string;
  isLoading?: boolean;
}

function formatDate(d: string | Date) {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(date);
}

function sortByDateDesc(a: GameWithRelations, b: GameWithRelations) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function useSearch(items: GameWithRelations[], q: string, keys: string[]) {
  if (!q) return items;
  const needle = q.toLowerCase();
  return items.filter(it => keys.some(k => {
    const value = k === 'partner' ? it.partner?.displayName || it.partner?.email :
                  k === 'club' ? it.event?.clubName :
                  (it as any)[k];
    return String(value ?? "").toLowerCase().includes(needle);
  }));
}

export default function RecentGamesDashboard({ 
  games = [], 
  limit = 10, 
  title = "Recent Games",
  isLoading = false 
}: RecentGamesDashboardProps) {
  const [query, setQuery] = React.useState("");

  const sorted = React.useMemo(() => [...games].sort(sortByDateDesc), [games]);
  const filtered = useSearch(sorted, query, ["name", "club", "partner"]);
  const rows = filtered.slice(0, limit);

  if (isLoading) {
    return (
      <section className="w-full">
        <Card className="shadow-sm border-none bg-gradient-to-b from-background to-muted/30">
          <CardHeader className="gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-xl tracking-tight">{title}</CardTitle>
                <p className="text-sm text-muted-foreground">Most recent first. Showing name, date, partner, and club.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="w-full">
      <Card className="shadow-sm border-none bg-gradient-to-b from-background to-muted/30">
        <CardHeader className="gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl tracking-tight">{title}</CardTitle>
              <p className="text-sm text-muted-foreground">Most recent first. Showing name, date, partner, and club.</p>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex whitespace-nowrap">
              {rows.length} shown
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search by name, partner, or club"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="max-w-xs"
              data-testid="input-search-games"
            />
            <div className="ml-auto" />
            <Link href="/my-games">
              <Button variant="ghost" size="sm" data-testid="button-view-all">
                View all
              </Button>
            </Link>
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
                      onClick={() => window.location.href = `/games/${g.id}`}
                      data-testid={`row-game-${g.id}`}
                    >
                      <TableCell className="font-medium">{g.name}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(g.createdAt)}</TableCell>
                      <TableCell>{g.partner?.displayName || g.partner?.email || "—"}</TableCell>
                      <TableCell>{g.event?.clubName || "—"}</TableCell>
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
                onClick={() => window.location.href = `/games/${g.id}`}
                className="text-left rounded-2xl border p-4 bg-card hover:bg-muted/40 transition"
                data-testid={`card-game-${g.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium leading-tight">{g.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" /> 
                        {formatDate(g.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> 
                        {g.partner?.displayName || g.partner?.email || "—"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> 
                        {g.event?.clubName || "—"}
                      </span>
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
        <Link href="/create-game">
          <Button size="sm" data-testid="button-new-game">
            New game
          </Button>
        </Link>
      </div>
    </div>
  );
}