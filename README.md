# E Scooter Rental App Clone

A functional React Native application that replicates the core features of the Lime e-scooter rental platform. Built with Expo, Expo Router and TypeScript, this app demonstrates real-time mapping, user authentication, and scooter journey simulation.

## Project Overview

This application provides users with a real-time map interface to locate available scooters, authenticate using email, and simulate scooter journeys. The app leverages Mapbox for mapping functionality and Supabase for backend services including authentication and geospatial data storage.

## Features

- **User Authentication**
  - Email-based signup and login via Supabase Auth
  - Secure session management
  - Protected routes for authenticated users

- **Interactive Map Experience**
  - Real-time scooter availability displayed on Mapbox
  - User location tracking with permission handling
  - Scooter clustering for improved map readability

- **Scooter Rental Flow**
  - Scooter selection and details view
  - Distance and duration calculations to nearby scooters
  - Navigation directions to selected scooters

- **Ride Experience**
  - Active ride tracking and route recording
  - Journey statistics (distance, duration)

- **Geospatial Features**
  - Location-based scooter discovery
  - Integration with Supabase PostGIS for spatial queries
  - Route visualization and distance calculations

## Tech Stack

### Frontend
- **React Native** (Expo framework)
- **TypeScript** for type safety
- **React Navigation** (Expo Router) for navigation
- **React Native Mapbox GL** for mapping

### Backend
- **Supabase**
  - Authentication
  - PostgreSQL database
  - PostGIS extension for geospatial queries
  - Row Level Security (RLS) for data protection

### State Management
- React Context API
- React Hooks

### APIs
- Mapbox for maps and directions
- Expo Location for device positioning

### Development
- Environment variables for configuration
- TypeScript for enhanced developer experience

### Row Level Security (RLS)

The Supabase database uses RLS policies to ensure data security:

- Scooters are readable by all authenticated users
- Rides are only readable/writable by the user who created them

## Setup Instructions

### Prerequisites
- Node.js (v16 or newer)
- npm or yarn
- Expo CLI
- Supabase account
- Mapbox account and API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/RishieVyas/E-Scooter-App.git
   cd E-Scooter-App
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   EXPO_PUBLIC_MAPBOX_KEY=your_mapbox_access_token
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up your Supabase project:
   - Create a new Supabase project
   - Enable the PostGIS extension
   - Set up authentication and RLS policies

5. Generate native code if needed:
   ```bash
   npx expo prebuild
   ```

6. Start the development server:
   ```bash
   npx expo start
   ```

7. Run on a specific platform:
   ```bash
   # For Android
   npx expo run:android
   
   # For iOS
   npx expo run:ios
   ```

### Supabase Setup Details

1. Enable PostGIS extension in Supabase:
   ```sql
   create extension postgis;
   ```

2. Create the scooters table:
   ```sql
   CREATE TABLE scooters (
     id SERIAL PRIMARY KEY,
     location GEOGRAPHY(POINT),
     battery FLOAT NOT NULL DEFAULT 100,
     status TEXT NOT NULL DEFAULT 'available',
     last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

3. Create the rides table:
   ```sql
   CREATE TABLE rides (
     id SERIAL PRIMARY KEY,
     user_id UUID REFERENCES auth.users NOT NULL,
     scooter_id INTEGER REFERENCES scooters NOT NULL,
     started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     finished_at TIMESTAMP WITH TIME ZONE,
     routeCoords JSONB,
     routeDistance FLOAT,
     routeDuration FLOAT
   );
   ```

4. Set up RLS policies:
   ```sql
   -- Enable RLS
   ALTER TABLE scooters ENABLE ROW LEVEL SECURITY;
   ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
   
   -- Scooters readable by authenticated users
   CREATE POLICY "Scooters are viewable by authenticated users"
     ON scooters FOR SELECT
     TO authenticated
     USING (true);
   
   -- Rides CRUD for owner only
   CREATE POLICY "Users can CRUD their own rides"
     ON rides FOR ALL
     TO authenticated
     USING (auth.uid() = user_id);
   ```