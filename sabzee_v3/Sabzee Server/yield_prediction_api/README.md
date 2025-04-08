# Yield Prediction API

This is a Flask-based API for predicting crop yields based on location, soil type, crop type, and seasonal factors. It uses a combination of machine learning and feature-based approaches to provide accurate predictions.

## Features

- Predict crop yields based on various input factors
- Get crop recommendations based on soil and weather conditions
- Integrates with weather data (simulated for now, but can be linked to real weather APIs)
- Fallback mechanisms for resilience when ML model is unavailable

## New API Integrations

This API now supports real-time integration with:

1. **OpenWeatherMap API** for accurate weather data based on location:
   - Current temperature and humidity
   - Rainfall predictions from forecast data
   - Automatic caching to reduce API calls

2. **MapBox API** (frontend integration) for precise location selection:
   - Interactive map interface for selecting farm location
   - Reverse geocoding to get location names
   - Satellite view to help farmers identify their fields

## Setup

1. Ensure Python 3.8+ is installed on your system
2. Navigate to the `yield_prediction_api` directory
3. Run the API using the provided script:

```bash
python run_api.py
```

The script will automatically:
- Install required dependencies
- Start the Flask server on port 5002
- Fall back to feature-based prediction if the ML model isn't available

## Setup with API Keys

For optimal functionality, you need to configure API keys:

1. Copy the `.env.example` file to `.env`
   ```
   cp .env.example .env
   ```

2. Register for free API keys:
   - [OpenWeatherMap API Key](https://openweathermap.org/api) - Free tier allows 60 calls/minute
   - [MapBox API Key](https://www.mapbox.com/) - Free tier allows 50,000 maps loads/month

3. Add your API keys to the `.env` file:
   ```
   OPENWEATHER_API_KEY=your_key_here
   MAPBOX_API_KEY=your_key_here
   ```

4. The system will automatically use these APIs when keys are provided, or fall back to mock data if keys are missing.

## API Endpoints

### Health Check

```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "using_mock": true/false
}
```

### Yield Prediction

```
POST /predict
```

Request Body:
```json
{
  "latitude": 23.8103,
  "longitude": 90.4125,
  "crop": "Rice",
  "season": "Kharif",
  "area_of_land": 5,
  "soil_type": "Loamy"
}
```

Response:
```json
{
  "predicted_yield_kg": 3750,
  "suggested_crops": ["Maize", "Potatoes", "Tomatoes"],
  "confidence": 0.85,
  "is_mock": true,
  "weather": {
    "temperature": 28.5,
    "humidity": 65.3,
    "rainfall": 120.5
  }
}
```

## Supported Crops

- Rice
- Wheat
- Maize
- Sugarcane
- Cotton
- Soybeans
- Potatoes
- Tomatoes
- Onions
- Chillies

## Supported Soil Types

- Loamy
- Clay
- Sandy
- Silt
- Black
- Red

## Seasons

- Rabi (Winter)
- Kharif (Monsoon)
- Zaid (Summer)

## About Mock Mode vs ML Mode

This API is designed to operate in two modes:

1. **ML Mode**: Uses a pre-trained machine learning model to make predictions.
2. **Feature-based Mode**: Uses a rule-based system with agricultural knowledge to make predictions when the ML model is unavailable.

The API will automatically choose the appropriate mode. When operating in feature-based mode, the response will include `"is_mock": true`.

## Real-time vs. Mock Mode

### Weather Data
- **With API Key**: Gets real-time temperature, humidity, and calculated rainfall from forecasts
- **Without API Key**: Uses simulated weather data based on typical regional patterns

### Location Data
- **With MapBox**: Provides satellite imagery and location selection with real place names
- **Without MapBox**: Uses simple coordinate inputs

## Troubleshooting

1. If you get dependency conflicts, try installing the dependencies manually:
   ```
   pip install flask==2.0.1 flask-cors==3.0.10 werkzeug==2.0.3 numpy scikit-learn pandas
   ```

2. If you see errors about Flask version compatibility, check that you're using the versions specified in requirements.txt.

3. If port 5002 is already in use, you can modify the port in `app.py`.

4. For any other issues, check the logs printed to the console for detailed error messages. 