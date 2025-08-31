import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Event } from "@shared/schema";

export default function Events() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['/api/events'],
    queryFn: async () => {
      const response = await fetch('/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json() as Promise<Event[]>;
    },
  });

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.clubName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Club Events</h1>
          <p className="text-gray-600">Discover events and create games from official tournaments</p>
        </div>
        <Button variant="primary-green">
          <span className="mr-2">+</span>Create Event
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search events or clubs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
            <div className="text-sm text-gray-500">
              {filteredEvents.length} of {events.length} events
            </div>
          </div>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bridge-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="space-y-4">
          {filteredEvents.map(event => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{event.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        event.eventType === 'tournament' 
                          ? 'bg-blue-100 text-blue-800'
                          : event.eventType === 'casual'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {event.eventType}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        event.status === 'upcoming'
                          ? 'bg-yellow-100 text-yellow-800'
                          : event.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {event.clubName} • {new Date(event.eventDate).toLocaleDateString()} • {event.totalBoards} boards
                    </p>
                    
                    {event.description && (
                      <p className="text-sm text-gray-700 mb-3">{event.description}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <Link href={`/events/${event.id}`}>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </Link>
                    <Button size="sm" variant="primary-blue">
                      Create My Game
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          {searchQuery ? (
            <>
              <p>No events found matching "{searchQuery}"</p>
              <Button 
                variant="link" 
                onClick={() => setSearchQuery("")}
                className="mt-2"
              >
                Clear search
              </Button>
            </>
          ) : (
            <p>No events available yet. Check back soon for upcoming tournaments!</p>
          )}
        </div>
      )}
    </div>
  );
}
