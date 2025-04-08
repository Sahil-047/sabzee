# Environment Variables Setup Guide

This guide will help you set up the required API keys for the real-time location tracking and weather data features of the application.

## Required API Keys

The application uses two external APIs:

1. **MapBox API** - For interactive maps and real-time location tracking
2. **OpenWeatherMap API** - For real-time weather data based on location

## Step 1: Create a `.env` file

Create a `.env` file in the root of the `Client` directory with the following template:

```
# MapBox API Key
VITE_MAPBOX_API_KEY=your_mapbox_key_here

# OpenWeatherMap API Key
VITE_OPENWEATHER_API_KEY=your_openweather_key_here
```

## Step 2: Get a MapBox API Key

1. Go to [https://www.mapbox.com/](https://www.mapbox.com/) and create a free account
2. Navigate to your account dashboard
3. Create a new access token or use the default public token
4. Copy the token and paste it in your `.env` file as the value for `VITE_MAPBOX_API_KEY`

## Step 3: Get an OpenWeatherMap API Key

1. Go to [https://openweathermap.org/api](https://openweathermap.org/api) and create a free account
2. Navigate to the "API Keys" tab in your account dashboard
3. Create a new API key or use the default one provided
4. Copy the key and paste it in your `.env` file as the value for `VITE_OPENWEATHER_API_KEY`

## Step 4: Restart the Application

After adding these environment variables, restart your development server for the changes to take effect:

```bash
npm run dev
```

## Features Enabled by API Keys

### MapBox API Key
- Interactive satellite map view
- Real-time location tracking with high accuracy
- Reverse geocoding (converting coordinates to location names)
- Ability to search for and select specific farm locations

### OpenWeatherMap API Key
- Real-time temperature data for the selected location
- Current humidity levels
- Rainfall forecasts and historical data
- More accurate yield predictions based on real weather conditions

## Note on API Usage Limits

Both MapBox and OpenWeatherMap offer generous free tiers:

- **MapBox**: 50,000 map loads per month on the free tier
- **OpenWeatherMap**: 60 calls per minute / 1,000,000 calls per month on the free tier

These limits should be more than sufficient for development and small-scale production use.

## Fallback Behavior

If API keys are not provided, the application will fall back to:
- A basic map interface with manual coordinate entry
- Simulated weather data based on seasonal patterns
- Less accurate yield predictions 