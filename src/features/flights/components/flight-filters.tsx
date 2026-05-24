import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

export function FlightFilters() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stops */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Stops</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="direct" />
              <Label htmlFor="direct">Non-stop</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="1-stop" />
              <Label htmlFor="1-stop">1 Stop</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="2-stops" />
              <Label htmlFor="2-stops">2+ Stops</Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Price Range */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold">Price Range</h3>
            <span className="text-xs text-muted-foreground">$0 - $2,000</span>
          </div>
          <Slider defaultValue={[2000]} max={2000} step={10} />
        </div>

        <Separator />

        {/* Airlines */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Airlines</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="airline-1" />
              <Label htmlFor="airline-1">Vietnam Airlines</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="airline-2" />
              <Label htmlFor="airline-2">Vietjet Air</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="airline-3" />
              <Label htmlFor="airline-3">Bamboo Airways</Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Cabin Class */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Cabin Class</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="economy" defaultChecked />
              <Label htmlFor="economy">Economy</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="premium-economy" />
              <Label htmlFor="premium-economy">Premium Economy</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="business" />
              <Label htmlFor="business">Business</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
