import * as Location from 'expo-location';
import { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { useAuth } from './AuthProvider';

import { supabase } from '~/lib/supabase';
import { fetchDirectionBasedOnCoords } from '~/services/directions';

// Define types for our context and state
type Ride = {
  id: number;
  user_id: string;
  scooter_id: number;
  started_at: string;
  finished_at: string | null;
  routeDuration?: number;
  routeDistance?: number;
  routeCoords?: number[][];
};

type RideContextType = {
  startRide: (scooterId: number) => Promise<void>;
  finishRide: () => Promise<void>;
  ride: Ride | undefined;
  rideRoute: number[][];
};

const RideContext = createContext<RideContextType>({} as RideContextType);

export default function RideProvider({ children }: PropsWithChildren) {
  const [ride, setRide] = useState<Ride | undefined>(undefined);
  const [rideRoute, setRideRoute] = useState<number[][]>([]);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  const { userId } = useAuth();

  // Request location permissions when the component mounts
  useEffect(() => {
    const requestLocationPermission = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to track your ride.');
        setLocationPermissionGranted(false);
      } else {
        setLocationPermissionGranted(true);
      }
    };

    requestLocationPermission();
  }, []);

  useEffect(() => {
    const fetchActiveRide = async () => {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('user_id', userId)
        .is('finished_at', null)
        .limit(1)
        .single();

      if (data) {
        setRide(data);
      }
    };

    fetchActiveRide();
  }, []);

  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined;

    const watchLocation = async () => {
      // Only proceed if location permission is granted
      if (!locationPermissionGranted) return;
      
      subscription = await Location.watchPositionAsync({ distanceInterval: 30 }, (newLocation) => {
        console.log('New location: ', newLocation.coords.longitude, newLocation.coords.latitude);
        setRideRoute((currrRoute) => [
          ...currrRoute,
          [newLocation.coords.longitude, newLocation.coords.latitude],
        ]);
        // const from = point([newLocation.coords.longitude, newLocation.coords.latitude]);
        // const to = point([selectedScooter.long, selectedScooter.lat]);
        // const distance = getDistance(from, to, { units: 'meters' });
        // if (distance < 100) {
        //   setIsNearby(true);
        // }
      });
    };

    if (ride && locationPermissionGranted) {
      watchLocation();
    }

    // unsubscribe
    return () => {
      subscription?.remove();
    };
  }, [ride, locationPermissionGranted]);

  const startRide = async (scooterId: number) => {
    if (ride) {
      Alert.alert('Cannot start a new ride while another one is in progress');
      return;
    }
    const { data, error } = await supabase
      .from('rides')
      .insert([
        {
          user_id: userId,
          scooter_id: scooterId,
        },
      ])
      .select();
    if (error) {
      Alert.alert('Failed to start the ride');
      console.log(error);
    } else {
      setRide(data[0]);
    }
  };

  const finishRide = async () => {
    if (!ride) {
      return;
    }

    const actualRoute = await fetchDirectionBasedOnCoords(rideRoute);
    const rideRouteCoords = actualRoute.matchings[0].geometry.coordinates;
    const rideRouteDuration = actualRoute.matchings[0].duration;
    const rideRouteDistance = actualRoute.matchings[0].distance;
    setRideRoute(actualRoute.matchings[0].geometry.coordinates);

    const { error } = await supabase
      .from('rides')
      .update({
        finished_at: new Date(),
        routeDuration: rideRouteDuration,
        routeDistance: rideRouteDistance,
        routeCoords: rideRouteCoords,
      })
      .eq('id', ride.id);

    if (error) {
      Alert.alert('Failed to finish the ride');
    } else {
      setRide(undefined);
    }
  };

  return (
    <RideContext.Provider value={{ startRide, finishRide, ride, rideRoute }}>
      {children}
    </RideContext.Provider>
  );
}

export const useRide = () => useContext(RideContext);
