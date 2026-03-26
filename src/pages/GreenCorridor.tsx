import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, MapPin } from 'lucide-react';
import CityMap from '@/components/dashboard/CityMap';
import TrafficLightIcon from '@/components/dashboard/TrafficLightIcon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api';

function isPresent<T>(value: T | null | undefined): value is T {
  return value != null;
}

export default function GreenCorridor() {
  const queryClient = useQueryClient();
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [selectedIntersections, setSelectedIntersections] = useState<string[]>([]);

  const { data: intersections = [] } = useQuery({
    queryKey: ['intersections'],
    queryFn: api.getIntersections,
  });

  useEffect(() => {
    return api.subscribeToEvents((data) => {
      queryClient.setQueryData(['intersections'], data.intersections);
    });
  }, [queryClient]);

  const greenCorridorMutation = useMutation({
    mutationFn: (route: string[]) =>
      api.activateGreenCorridor({
        route,
        type: 'ambulance',
        source: intersections.find((entry) => entry.id === route[0])?.name,
        destination: intersections.find((entry) => entry.id === route.at(-1))?.name,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intersections'] });
      queryClient.invalidateQueries({ queryKey: ['traffic'] });
      queryClient.invalidateQueries({ queryKey: ['signals'] });
      queryClient.invalidateQueries({ queryKey: ['emergency-events'] });
    },
  });

  const orderedRoute = useMemo(
    () =>
      selectedIntersections
        .map((id) => intersections.find((intersection) => intersection.id === id))
        .filter(isPresent),
    [intersections, selectedIntersections],
  );

  const toggleIntersection = (id: string) => {
    if (!emergencyMode) return;

    setSelectedIntersections((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
  };

  const applyGreenCorridor = () => {
    if (!emergencyMode || selectedIntersections.length === 0) return;
    greenCorridorMutation.mutate(selectedIntersections);
  };

  const clearCorridor = () => {
    setSelectedIntersections([]);
    setEmergencyMode(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-mono-tech neon-text-cyan">Green Corridor Control</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="emergency-mode" className="text-sm font-medium">
              Emergency Mode
            </Label>
            <Switch id="emergency-mode" checked={emergencyMode} onCheckedChange={setEmergencyMode} />
          </div>
          {emergencyMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-3 py-1 rounded-md bg-neon-red/10 border border-neon-red/30"
            >
              <AlertTriangle className="h-4 w-4 text-neon-red" />
              <span className="text-sm font-mono-tech text-neon-red">ACTIVE</span>
            </motion.div>
          )}
        </div>
      </div>

      {!emergencyMode && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Enable Emergency Mode to select a route and activate a backend-managed green corridor.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-mono-tech">Select Route Intersections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
              {intersections.map((intersection) => {
                const isSelected = selectedIntersections.includes(intersection.id);
                return (
                  <motion.button
                    key={intersection.id}
                    onClick={() => toggleIntersection(intersection.id)}
                    disabled={!emergencyMode}
                    whileHover={emergencyMode ? { scale: 1.02 } : {}}
                    className={`w-full p-3 rounded-md border text-left transition-all ${
                      isSelected
                        ? 'border-neon-green bg-neon-green/10'
                        : 'border-border hover:border-primary/50'
                    } ${!emergencyMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TrafficLightIcon signal={intersection.signal} size="sm" />
                        <div>
                          <p className="text-sm font-medium">{intersection.name}</p>
                          <p className="text-xs text-muted-foreground font-mono-tech">{intersection.id}</p>
                        </div>
                      </div>
                      {isSelected && <CheckCircle className="h-4 w-4 text-neon-green" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {emergencyMode && (
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={applyGreenCorridor}
                  disabled={selectedIntersections.length === 0 || greenCorridorMutation.isPending}
                  className="flex-1 bg-neon-green hover:bg-neon-green/90 text-black font-mono-tech"
                >
                  {greenCorridorMutation.isPending ? 'Applying...' : 'Apply Green Corridor'}
                </Button>
                <Button onClick={clearCorridor} variant="outline" className="flex-1">
                  Clear Selection
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-mono-tech">Route Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <CityMap highlightRoute={selectedIntersections} liveIntersections={intersections} />
            </CardContent>
          </Card>

          {orderedRoute.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-mono-tech">Green Corridor Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {orderedRoute.length} intersection{orderedRoute.length !== 1 ? 's' : ''} selected for backend corridor activation
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {orderedRoute.map((intersection) => (
                      <motion.div
                        key={intersection.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neon-green/10 border border-neon-green/30"
                      >
                        <MapPin className="h-3 w-3 text-neon-green" />
                        <span className="text-xs font-mono-tech text-neon-green">
                          {intersection.name} - {intersection.signal.toUpperCase()}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
