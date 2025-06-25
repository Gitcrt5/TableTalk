import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Shuffle, TrendingUp } from "lucide-react";

export default function Sidebar() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="ghost" className="w-full justify-start">
            <Upload className="mr-3 h-4 w-4" />
            Upload New Game
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Shuffle className="mr-3 h-4 w-4" />
            Random Hand
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <TrendingUp className="mr-3 h-4 w-4" />
            View Progress
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Games</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Convention</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="All Conventions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conventions</SelectItem>
                <SelectItem value="standard">Standard American</SelectItem>
                <SelectItem value="precision">Precision</SelectItem>
                <SelectItem value="2over1">2/1 Game Force</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Vulnerability</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="ns">N-S Only</SelectItem>
                <SelectItem value="ew">E-W Only</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Difficulty</label>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1">
                Easy
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                Hard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
