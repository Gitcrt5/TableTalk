import * as React from "react";
const suitClass = (token) => {
  if (!token) return "";
  if (token.includes("NT")) return "text-green-600";
  if (token.includes("♥") || token.includes("♦")) return "text-red-600";
  if (token.includes("♠") || token.includes("♣")) return "text-black";
  return "";
};

const ContractTag = ({ contract, declarer }) => (
  <span className={`px-1.5 py-0.5 rounded bg-gray-100 border ${suitClass(contract)}`}>
    {contract} {declarer}
  </span>
);

// Hand rendering helpers
const HCP_VALUES = { A:4, K:3, Q:2, J:1 };
const calcHcp = (hand) => {
  if (!hand) return 0;
  let t = 0;
  for (const s of Object.values(hand)) {
    if (!s) continue;
    for (const ch of s) t += HCP_VALUES[ch] || 0;
  }
  return t;
};

const SuitLine = ({ symbol, cards }) => (
  <div className="leading-tight"><span className={symbol==='NT' ? 'text-green-600' : (symbol==='♥'||symbol==='♦') ? 'text-red-600' : 'text-black'}>{symbol}</span> {cards || '—'}</div>
);

const HandPanel = ({ label, hand }) => (
  <div className="rounded-lg border p-2">
    <div className="flex items-center justify-between">
      <div className="font-medium">{label}</div>
      <div className="text-xs text-gray-500">HCP {calcHcp(hand)}</div>
    </div>
    <div className="mt-1 text-gray-700 space-y-0.5">
      <SuitLine symbol="♠" cards={hand?.S} />
      <SuitLine symbol="♥" cards={hand?.H} />
      <SuitLine symbol="♦" cards={hand?.D} />
      <SuitLine symbol="♣" cards={hand?.C} />
    </div>
  </div>
);

const sampleHands = {
  N: { S:'AKQJ', H:'64', D:'872', C:'A94' },
  E: { S:'73', H:'AQJ97', D:'KQ3', C:'865' },
  S: { S:'9652', H:'KT8', D:'AJT9', C:'72' },
  W: { S:'T84', H:'532', D:'654', C:'KQJT' }
};

// Partner state is managed within the component now.

// App chrome components
const AppHeader = () => (
  <div className="mb-4 -mx-4 -mt-4 px-4 py-3 border-b flex items-center justify-between">
    <div className="flex items-center gap-3">
      {/* Logo mark */}
      <div className="relative w-8 h-8 rounded-lg bg-white border flex items-center justify-center">
        <div className="text-[10px] leading-none">
          <span className="text-black">♠</span>
          <span className="text-red-600 ml-0.5">♥</span>
          <span className="text-red-600 ml-0.5">♦</span>
          <span className="text-black ml-0.5">♣</span>
        </div>
      </div>
      <div>
        <div className="text-lg font-semibold">TableTalk</div>
        <div className="text-xs text-gray-500">Review and discuss your bridge games</div>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-gray-100 border flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
      </div>
      <span className="text-sm font-medium text-gray-900">Alice Johnson</span>
    </div>
  </div>
);

const AppFooter = () => (
  <div className="mt-4 -mx-4 -mb-4 px-4 py-2 border-t text-xs text-gray-500">Footer placeholder</div>
);

const PageNav = ({ showHome = true, showBack = true }) => (
  <div className="mb-3 -mx-4 px-4 py-2 bg-white/60 flex items-center gap-2 text-sm">
    {showBack && <button className="px-2.5 py-1 rounded-lg border">← Previous</button>}
    {showHome && <button className="px-2.5 py-1 rounded-lg border">Home</button>}
  </div>
);

export default function TableTalkWireframesAppChrome() {
  const [partner, setPartner] = React.useState(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [removeOpen, setRemoveOpen] = React.useState(false);
  const demoRecent = [
    { name: 'Zoe Fox', email: 'zoe@example.com' },
    { name: 'Ben Lee', email: 'ben.lee@example.com' },
    { name: 'Maya Singh', email: 'maya.s@example.com' }
  ];
  const [query, setQuery] = React.useState('');
  const filtered = demoRecent.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.email.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="sticky top-0 z-20 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">TableTalk Wireframes</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden sm:inline text-gray-500">MVP user flows</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Screen 1: Dashboard */}
          <section className="bg-white rounded-2xl shadow p-4">
            <AppHeader />
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">1) Dashboard: My Games</h2>
              <button className="px-3 py-1.5 rounded-xl bg-gray-900 text-white text-sm">Create Game</button>
            </div>
            <p className="text-xs text-gray-500 mb-3">Quick view of recent games, entry points to create or adopt from an Event.</p>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <input className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[240px]" placeholder="Search my games..." />
              <button className="px-3 py-1.5 rounded-xl border text-sm">All My Games</button>
            </div>
            <div className="mb-3 p-3 rounded-xl bg-gray-50 border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Continue</div>
                  <div className="text-xs text-gray-500">Pick up where you left off</div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button className="px-2.5 py-1 rounded-lg border">Resume last board</button>
                  <button className="px-2.5 py-1 rounded-lg border">Open last game</button>
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { name: "Monday Club Pairs", date: "2025-08-01", boards: 27, vis: "public", partner: "Zoe" },
                { name: "Practice set with Zoe", date: "2025-07-20", boards: 12, vis: "public", partner: "Zoe" },
                { name: "Cardrona Social", date: "2025-04-10", boards: 24, vis: "public" },
                { name: "Training 2NT openings", date: "2025-03-05", boards: 16, vis: "public" }
              ].map((g, i) => (
                <div key={i} className="rounded-xl border p-3 hover:shadow-sm transition">
                  <div className="flex items-center justify-between">
                    <div className="font-medium truncate">{g.name}</div>
                    <span className="text-[10px] uppercase tracking-wide bg-gray-100 border rounded px-1.5 py-0.5">{g.vis}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{g.date} • {g.boards} boards{g.partner && <> • Partner {g.partner}</>}</div>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <button className="px-2.5 py-1 rounded-lg border">Open</button>
                    <button className="px-2.5 py-1 rounded-lg border">Boards</button>
                    <button className="px-2.5 py-1 rounded-lg border">Comments</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 rounded-xl bg-gray-50 border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Recent activity</div>
                  <div className="text-xs text-gray-500">Recently commented on your games</div>
                </div>
                <button className="px-3 py-1.5 rounded-xl border text-sm">View all</button>
              </div>
              <div className="mt-2 grid gap-2 text-sm">
                {[
                  { who:"Zoe", when:"2h ago", game:"Monday Club Pairs", board:7, excerpt:"What about 3NT instead of 4H here?" },
                  { who:"Ben", when:"Yesterday", game:"Practice set with Zoe", board:3, excerpt:"Lead looks better from the top of sequence." },
                  { who:"Maya", when:"2 days ago", game:"Cardrona Social", board:12, excerpt:"Par shows 3S W, interesting swing." }
                ].map((c,i)=>(
                  <div key={i} className="flex items-start justify-between rounded border p-2">
                    <div>
                      <div className="font-medium">{c.game} • Board {c.board}</div>
                      <div className="text-xs text-gray-500">Comment by {c.who} • {c.when}</div>
                      <div className="text-sm mt-1">{c.excerpt}</div>
                    </div>
                    <button className="px-2.5 py-1 rounded-lg border text-xs">Open</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 p-3 rounded-xl bg-gray-50 border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Discover public games</div>
                  <div className="text-xs text-gray-500">Search games shared by other players</div>
                </div>
                <button className="px-3 py-1.5 rounded-xl border text-sm">Explore Public Games</button>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-xl bg-gray-50 border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Club Events</div>
                  <div className="text-xs text-gray-500">Find an event and create your own game from it.</div>
                </div>
                <button className="px-3 py-1.5 rounded-xl border">Browse Events</button>
              </div>
            </div>
            <AppFooter />
          </section>

          {/* Screen 2: My Games - All */}
          <section className="bg-white rounded-2xl shadow p-4">
            <AppHeader />
            <PageNav />
            <h2 className="text-lg font-semibold mb-3">2) My Games: All</h2>
            <div className="mb-3 grid gap-2 sm:grid-cols-4">
              <input className="border rounded-lg px-3 py-2 text-sm sm:col-span-2" placeholder="Search my games..." />
              <select className="border rounded-lg px-3 py-2 text-sm"><option>Any partner</option><option>Zoe</option><option>Ben</option></select>
              <select className="border rounded-lg px-3 py-2 text-sm"><option>Any club</option><option>ABC Club</option><option>City Bridge</option></select>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 border-b cursor-pointer">Name ▲</th>
                    <th className="text-left px-3 py-2 border-b cursor-pointer">Date</th>
                    <th className="text-left px-3 py-2 border-b cursor-pointer">Boards</th>
                    <th className="text-left px-3 py-2 border-b">Partner</th>
                    <th className="text-left px-3 py-2 border-b">Club</th>
                    <th className="text-left px-3 py-2 border-b">Visibility</th>
                    <th className="text-left px-3 py-2 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 border-b">Game {i + 1}</td>
                      <td className="px-3 py-2 border-b">2025-07-{String(10 + i).padStart(2,'0')}</td>
                      <td className="px-3 py-2 border-b">{12 + (i % 3) * 4}</td>
                      <td className="px-3 py-2 border-b">{i % 2 === 0 ? "Zoe" : "—"}</td>
                      <td className="px-3 py-2 border-b">{i % 2 === 0 ? "ABC Club" : "City Bridge"}</td>
                      <td className="px-3 py-2 border-b"><span className="text-[10px] uppercase tracking-wide bg-gray-100 border rounded px-1.5 py-0.5">public</span></td>
                      <td className="px-3 py-2 border-b">
                        <div className="flex items-center gap-2">
                          <button className="px-2.5 py-1 rounded-lg border">Open</button>
                          <button className="px-2.5 py-1 rounded-lg border">Boards</button>
                          <button className="px-2.5 py-1 rounded-lg border">Comments</button>
                          <button className="px-2 py-1 rounded-lg border" title="Pin">★</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <div>Showing 1–8 of 128</div>
              <div className="flex items-center gap-1">
                <button className="px-2 py-1 rounded border">Prev</button>
                <button className="px-2 py-1 rounded border">1</button>
                <button className="px-2 py-1 rounded border">2</button>
                <button className="px-2 py-1 rounded border">3</button>
                <button className="px-2 py-1 rounded border">Next</button>
              </div>
            </div>
            <AppFooter />
          </section>

          {/* Screen 3: Explore Public Games */}
          <section className="bg-white rounded-2xl shadow p-4">
            <AppHeader />
            <PageNav />
            <h2 className="text-lg font-semibold mb-3">3) Explore Public Games</h2>
            <div className="mb-3 grid gap-2 sm:grid-cols-5">
              <input className="border rounded-lg px-3 py-2 text-sm sm:col-span-2" placeholder="Search cards, contract, player, partner, club..." />
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Player" />
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Partner" />
              <select className="border rounded-lg px-3 py-2 text-sm"><option>Any club</option><option>ABC Club</option><option>City Bridge</option></select>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[{n:"Ann Jones", g:"Monday Pairs", d:"2025-07-02", c:"3NT N"}, {n:"Liam Chen", g:"City Swiss", d:"2025-06-14", c:"4♥ S"}, {n:"Priya Rao", g:"Club Night", d:"2025-05-21", c:"2♠ W"}].map((r, i) => (
                <div key={i} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium truncate">{r.g}</div>
                    <span className="text-[10px] uppercase tracking-wide bg-gray-100 border rounded px-1.5 py-0.5">public</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{r.d} • by {r.n}</div>
                  <div className="mt-1 text-xs">Latest contract: <span className={`${suitClass(r.c)}`}>{r.c}</span></div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <button className="px-2.5 py-1 rounded-lg border">Open</button>
                    <button className="px-2.5 py-1 rounded-lg border">View Boards</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <div>Showing 1–3 of 3</div>
              <div className="flex items-center gap-1">
                <button className="px-2 py-1 rounded border">Prev</button>
                <button className="px-2 py-1 rounded border">1</button>
                <button className="px-2 py-1 rounded border">Next</button>
              </div>
            </div>
            <AppFooter />
          </section>

          {/* Screen 4: Board View + Bidding (Desktop) */}
          <section className="bg-white rounded-2xl shadow p-4">
            <AppHeader />
            <PageNav />
            <h2 className="text-lg font-semibold mb-3">4) Board View + Bidding</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Board 7</div>
                  <div className="text-xs text-gray-500">Dealer S • Vul NS</div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                  <HandPanel label="North" hand={sampleHands.N} />
                  <HandPanel label="East" hand={sampleHands.E} />
                  <HandPanel label="South" hand={sampleHands.S} />
                  <HandPanel label="West" hand={sampleHands.W} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <label className="block">Lead card
                    <input className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="e.g., SQ" />
                  </label>
                  <label className="block">Tricks taken
                    <input type="number" min="0" max="13" className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="10" />
                  </label>
                  <label className="col-span-2 block">Notes
                    <textarea className="mt-1 w-full border rounded-lg px-3 py-2" rows={2} placeholder="Partnership discussion..." />
                  </label>
                </div>
              </div>

              <div className="rounded-xl border p-3 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Bidding Pad</div>
                  <div className="text-xs text-gray-500">Strict validation, Undo, Clear</div>
                </div>
                <div className="grid grid-cols-5 gap-2 text-sm">
                  {Array.from({ length: 7 }).map((_, level) => (
                    <div key={level} className="col-span-5 grid grid-cols-5 gap-2">
                      {["♣", "♦", "♥", "♠", "NT"].map((s, i) => (
                        <button key={i} className="py-2 rounded-lg border hover:bg-gray-50"><span className={suitClass(s)}>{level + 1}{s}</span></button>
                      ))}
                    </div>
                  ))}
                  <button className="py-2 rounded-lg border col-span-2">Pass</button>
                  <button className="py-2 rounded-lg border">X</button>
                  <button className="py-2 rounded-lg border">XX</button>
                  <button className="py-2 rounded-lg border col-span-2">Undo</button>
                  <button className="py-2 rounded-lg border col-span-2">Clear</button>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">Bidding sequence</div>
                  <div className="min-h-[48px] rounded-lg border px-3 py-2 text-sm flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-1 rounded bg-gray-100 border ${suitClass("1♥")}`}>1♥</span>
                    <span className="px-2 py-1 rounded bg-gray-100 border">Pass</span>
                    <span className={`px-2 py-1 rounded bg-gray-100 border ${suitClass("2♥")}`}>2♥</span>
                    <span className="px-2 py-1 rounded bg-gray-100 border">Pass</span>
                    <span className={`px-2 py-1 rounded bg-gray-100 border ${suitClass("4♥")}`}>4♥</span>
                    <span className="px-2 py-1 rounded bg-gray-100 border">All Pass</span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <label className="block">Contract
                    <input className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="4H" />
                  </label>
                  <label className="block">Declarer
                    <select className="mt-1 w-full border rounded-lg px-3 py-2"><option>N</option><option>E</option><option>S</option><option>W</option></select>
                  </label>
                  <label className="block">Result
                    <input className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="= / +1 / -1" />
                  </label>
                </div>
                <div className="mt-3 flex justify-end gap-2 text-sm">
                  <button className="px-3 py-1.5 rounded-xl border">Save draft</button>
                  <button className="px-3 py-1.5 rounded-xl bg-gray-900 text-white">Save</button>
                </div>
                <div className="mt-3 p-2 rounded-lg bg-gray-50 border text-xs text-gray-600">Optimum/Par from PBN if provided.</div>
              </div>
            </div>
            <AppFooter />
          </section>

          {/* Screen 5: Mobile Bidding (single screen, no scroll) */}
          <section className="bg-white rounded-2xl shadow p-0 overflow-hidden">
            <div className="bg-gray-900 text-white px-3 py-2 text-sm flex items-center justify-between">
              <div>5) Mobile Bidding</div>
              <div className="text-[11px]">Sticky controls</div>
            </div>
            <div className="p-3 grid grid-cols-1 gap-2 text-xs">
              <div className="rounded-lg border p-2 flex items-center justify-between">
                <div className="font-medium">Board 7</div>
                <div className="text-gray-500">Dealer S • Vul NS</div>
              </div>

              <div className="grid grid-cols-5 gap-1 text-sm">
                {[1, 2, 3, 4, 5, 6, 7].map((lvl) => (
                  ["♣", "♦", "♥", "♠", "NT"].map((s, i) => (
                    <button key={`${lvl}-${i}`} className="py-2 rounded-lg border"><span className={suitClass(s)}>{lvl}{s}</span></button>
                  ))
                ))}
              </div>
              <div className="mt-1 flex items-center gap-1 text-sm">
                <button className="px-3 py-2 rounded-lg border flex-1">Pass</button>
                <button className="px-2.5 py-2 rounded-lg border shrink-0">X</button>
                <button className="px-2 py-2 rounded-lg border shrink-0">XX</button>
                <button className="px-2.5 py-2 rounded-lg border shrink-0" aria-label="Undo" title="Undo">↩</button>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">Bidding sequence</div>
                <div className="min-h-[64px] rounded border bg-gray-50 p-2 flex flex-wrap gap-1">
                  <span className={`px-2 py-1 rounded bg-white border ${suitClass("1♥")}`}>1♥</span>
                  <span className="px-2 py-1 rounded bg-white border">Pass</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <input className="px-2 py-1.5 border rounded-lg" placeholder="Lead (e.g., SQ)" />
                <input className="px-2 py-1.5 border rounded-lg" placeholder="Tricks" />
                <input className="px-2 py-1.5 border rounded-lg" placeholder="Result (=, +1, -1)" />
              </div>
            </div>
            <div className="p-3 pt-0">
              <input className="w-full px-2 py-1.5 border rounded-lg text-sm" placeholder="Quick comment..." />
            </div>
            <div className="sticky bottom-0 bg-white border-t p-2 flex items-center justify-between gap-2">
              <button className="px-3 py-1.5 rounded-xl border text-sm">Prev</button>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Board
                  <input type="number" min="1" className="ml-2 w-16 border rounded-lg px-2 py-1 text-sm" placeholder="7" />
                </label>
                <button className="px-2.5 py-1 rounded-xl border text-sm">Go</button>
              </div>
              <button className="px-3 py-1.5 rounded-xl bg-gray-900 text-white text-sm">Next</button>
            </div>
          </section>

          {/* Screen 6: Event Adopt */}
          <section className="bg-white rounded-2xl shadow p-4">
            <AppHeader />
            <PageNav />
            <h2 className="text-lg font-semibold mb-3">6) Adopt from Event</h2>
            <div className="rounded-xl border p-3">
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-2">
                  <div className="font-medium">Event search</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input className="px-2 py-1.5 border rounded-lg" placeholder="Club name" />
                    <input className="px-2 py-1.5 border rounded-lg" placeholder="Date range" />
                  </div>
                  <div className="mt-2 grid gap-2 text-xs">
                    {["City Pairs 12/08", "Wednesday Swiss 14/08", "Practice Set: 2NT"].map((e, i) => (
                      <div key={i} className="flex items-center justify-between rounded border p-2">
                        <div>
                          <div className="font-medium">{e}</div>
                          <div className="text-gray-500">Boards 28 • Status published</div>
                        </div>
                        <button className="px-2.5 py-1 rounded-lg border text-xs">Create my game</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border p-2">
                  <div className="font-medium">Options</div>
                  <label className="block mt-2 text-xs">Partner
                    <input className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="Email or name" />
                  </label>
                  <label className="block mt-2 text-xs">Side
                    <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"><option>Unknown</option><option>NS</option><option>EW</option></select>
                  </label>
                  <label className="block mt-2 text-xs">Clone strategy
                    <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"><option>Copy (default)</option><option>Link (future)</option></select>
                  </label>
                  <div className="mt-3 text-xs text-gray-500">Deals are copied into your game for MVP. Future option will link to shared event deals.</div>
                </div>
              </div>
            </div>
            <AppFooter />
          </section>

        </div>
      </main>
    </div>
  );
}
