import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import pickle
import os
import requests
import logging
import json
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
CROP_FEATURES = {
    'Rice': {'water_need': 0.9, 'temp_optimal': 25, 'soil_preference': 0.8},
    'Wheat': {'water_need': 0.7, 'temp_optimal': 20, 'soil_preference': 0.7},
    'Maize': {'water_need': 0.8, 'temp_optimal': 24, 'soil_preference': 0.9},
    'Sugarcane': {'water_need': 0.85, 'temp_optimal': 27, 'soil_preference': 0.75},
    'Cotton': {'water_need': 0.6, 'temp_optimal': 28, 'soil_preference': 0.6},
    'Soybeans': {'water_need': 0.75, 'temp_optimal': 26, 'soil_preference': 0.85},
    'Potatoes': {'water_need': 0.8, 'temp_optimal': 18, 'soil_preference': 0.7},
    'Tomatoes': {'water_need': 0.7, 'temp_optimal': 24, 'soil_preference': 0.8},
    'Onions': {'water_need': 0.6, 'temp_optimal': 22, 'soil_preference': 0.65},
    'Chillies': {'water_need': 0.65, 'temp_optimal': 25, 'soil_preference': 0.7}
}

SOIL_TYPES = {
    'Loamy': {'fertility': 0.9, 'drainage': 0.9, 'nutrient_retention': 0.85},
    'Clay': {'fertility': 0.7, 'drainage': 0.5, 'nutrient_retention': 0.9},
    'Sandy': {'fertility': 0.5, 'drainage': 0.9, 'nutrient_retention': 0.4},
    'Silt': {'fertility': 0.8, 'drainage': 0.7, 'nutrient_retention': 0.7},
    'Black': {'fertility': 0.9, 'drainage': 0.6, 'nutrient_retention': 0.9},
    'Red': {'fertility': 0.6, 'drainage': 0.7, 'nutrient_retention': 0.6}
}

SEASON_FACTORS = {
    'Rabi': {'temp_factor': 0.8, 'rainfall_factor': 0.7, 'sunlight_factor': 0.9},
    'Kharif': {'temp_factor': 1.0, 'rainfall_factor': 1.0, 'sunlight_factor': 0.8},
    'Zaid': {'temp_factor': 1.2, 'rainfall_factor': 0.5, 'sunlight_factor': 1.1}
}

# Base yields for crops (kg per hectare)
BASE_YIELDS = {
    'Rice': 4000,
    'Wheat': 3500,
    'Maize': 5000,
    'Sugarcane': 70000,
    'Cotton': 500,
    'Soybeans': 2500,
    'Potatoes': 25000,
    'Tomatoes': 40000,
    'Onions': 20000,
    'Chillies': 15000
}

# Weather API configuration
OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY', '')  # First try standard env var
if not OPENWEATHER_API_KEY:
    # Try alternative env var name that might be used in frontend
    OPENWEATHER_API_KEY = os.environ.get('VITE_OPENWEATHER_API_KEY', '')

USE_REAL_WEATHER_API = bool(OPENWEATHER_API_KEY)  # Only use real API if key is provided
WEATHER_CACHE_DURATION = 900  # Cache weather data for 15 minutes (in seconds)
weather_cache = {}  # Simple in-memory cache for weather data

class YieldPredictionModel:
    def __init__(self):
        self.model = None
        self.is_mock = True  # Start with mock model by default
        
        # Try to load the pre-trained model if it exists
        try:
            model_path = self._find_model_file()
            if model_path:
                with open(model_path, 'rb') as f:
                    self.model = pickle.load(f)
                self.is_mock = False
                logger.info(f"Loaded pre-trained model from {model_path}")
            else:
                logger.warning("No pre-trained model found, using feature-based prediction")
                self._create_mock_model()
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            logger.warning("Using feature-based prediction as fallback")
            self._create_mock_model()
    
    def _find_model_file(self):
        """Look for model file in various possible locations"""
        possible_paths = [
            os.path.abspath('../../yield_prediction_model.pkl'),
            os.path.abspath('../yield_prediction_model.pkl'),
            os.path.abspath('yield_prediction_model.pkl'),
            'C:/Users/Muskaan/Downloads/Client/yield_prediction_model.pkl'
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                return path
        return None
    
    def _create_mock_model(self):
        """Create a simple model for when no pre-trained model exists"""
        self.model = RandomForestRegressor(n_estimators=10, random_state=42)
        # Train on minimal synthetic data
        X = np.random.rand(100, 10)  # Random features
        y = np.random.rand(100) * 5000  # Random yield values
        self.model.fit(X, y)
        logger.info("Created simple mock model")
    
    def _get_weather_data(self, lat, lng):
        """Get weather data from coordinates using OpenWeatherMap API"""
        # Check if we have cached data for this location
        cache_key = f"{lat:.4f}_{lng:.4f}"
        current_time = time.time()
        
        if cache_key in weather_cache:
            cache_entry = weather_cache[cache_key]
            # If cache is still valid, return the cached data
            if current_time - cache_entry['timestamp'] < WEATHER_CACHE_DURATION:
                logger.info(f"Using cached weather data for {lat}, {lng}")
                return cache_entry['data']
        
        # If we get here, we need fresh data
        if USE_REAL_WEATHER_API and OPENWEATHER_API_KEY:
            try:
                # Get current weather data 
                # Using the documented endpoint: https://openweathermap.org/current
                current_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lng}&appid={OPENWEATHER_API_KEY}&units=metric"
                logger.info(f"Requesting current weather data from OpenWeatherMap API for location: {lat}, {lng}")
                current_response = requests.get(current_url, timeout=15)
                current_response.raise_for_status()
                current_data = current_response.json()
                
                logger.info(f"Received weather data: {json.dumps(current_data, indent=2)}")
                
                # Extract relevant data
                temperature = current_data['main']['temp']
                humidity = current_data['main']['humidity']
                
                # Get precipitation data from current weather if available
                rainfall = 0
                if 'rain' in current_data:
                    # OpenWeatherMap may provide rainfall in mm for last 1h or 3h
                    if '1h' in current_data['rain']:
                        rainfall = current_data['rain']['1h']
                    elif '3h' in current_data['rain']:
                        rainfall = current_data['rain']['3h']
                
                # If no current rainfall, check forecast for precipitation prediction
                if rainfall == 0:
                    try:
                        # Get 5-day forecast data for rainfall prediction
                        forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lng}&appid={OPENWEATHER_API_KEY}&units=metric"
                        forecast_response = requests.get(forecast_url, timeout=15)
                        forecast_response.raise_for_status()
                        forecast_data = forecast_response.json()
                        
                        # Calculate average rainfall from forecast (mm per day)
                        rainfall_sum = 0
                        rainfall_periods = 0
                        
                        for forecast in forecast_data['list'][:8]:  # Next 24 hours (8 periods of 3 hours)
                            if 'rain' in forecast and '3h' in forecast['rain']:
                                rainfall_sum += forecast['rain']['3h']
                                rainfall_periods += 1
                        
                        # Calculate average daily rainfall prediction
                        if rainfall_periods > 0:
                            rainfall = rainfall_sum * 8 / max(1, rainfall_periods)
                    except Exception as e:
                        logger.warning(f"Error fetching forecast data: {str(e)}")
                
                # Scale up for seasonal prediction (convert daily to approximate monthly)
                rainfall = max(rainfall * 30, 10)  # Minimum 10mm to avoid extreme low values
                
                # Get additional weather info
                weather_main = current_data['weather'][0]['main'] if 'weather' in current_data and len(current_data['weather']) > 0 else "Unknown"
                weather_description = current_data['weather'][0]['description'] if 'weather' in current_data and len(current_data['weather']) > 0 else "Unknown"
                wind_speed = current_data['wind']['speed'] if 'wind' in current_data and 'speed' in current_data['wind'] else 0
                
                # Create weather data object with detailed information
                weather_data = {
                    'temperature': round(temperature, 1),
                    'humidity': round(humidity, 1),
                    'rainfall': round(rainfall, 1),
                    'weather_condition': weather_main,
                    'weather_description': weather_description,
                    'wind_speed': round(wind_speed, 1),
                    'source': 'openweathermap_api',
                    'timestamp': datetime.utcfromtimestamp(current_data['dt']).strftime('%Y-%m-%d %H:%M:%S UTC') if 'dt' in current_data else None
                }
                
                # Cache the result
                weather_cache[cache_key] = {
                    'timestamp': current_time,
                    'data': weather_data
                }
                
                logger.info(f"Retrieved real weather data: {weather_data}")
                return weather_data
                
            except Exception as e:
                logger.error(f"Error fetching weather data from API: {str(e)}")
                logger.warning("Falling back to mock weather data")
                # Fall through to mock data
        
        # Generate mock weather data as fallback
        weather_data = {
            'temperature': round(20 + np.random.rand() * 15, 1),  # 20-35°C
            'humidity': round(40 + np.random.rand() * 40, 1),     # 40-80%
            'rainfall': round(50 + np.random.rand() * 150, 1),    # 50-200mm
            'weather_condition': np.random.choice(['Clear', 'Clouds', 'Rain', 'Drizzle']),
            'weather_description': 'Simulated weather conditions',
            'wind_speed': round(2 + np.random.rand() * 8, 1),     # 2-10 m/s
            'source': 'mock_data',
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        # Cache even the mock data to reduce random variations in repeated calls
        weather_cache[cache_key] = {
            'timestamp': current_time,
            'data': weather_data
        }
        
        logger.info(f"Generated mock weather data: {weather_data}")
        return weather_data
    
    def _calculate_yield_feature_based(self, crop, season, soil_type, area_of_land, weather):
        """Calculate yield based on features when no ML model is available"""
        # Get base yield for crop
        if crop not in BASE_YIELDS:
            logger.warning(f"Unknown crop: {crop}, using average yield")
            base_yield = sum(BASE_YIELDS.values()) / len(BASE_YIELDS)
        else:
            base_yield = BASE_YIELDS[crop]
        
        # Get crop features
        crop_features = CROP_FEATURES.get(crop, {
            'water_need': 0.75, 
            'temp_optimal': 25, 
            'soil_preference': 0.7
        })
        
        # Get soil features
        soil_features = SOIL_TYPES.get(soil_type, {
            'fertility': 0.7, 
            'drainage': 0.7, 
            'nutrient_retention': 0.7
        })
        
        # Get season factors
        season_factors = SEASON_FACTORS.get(season, {
            'temp_factor': 1.0, 
            'rainfall_factor': 1.0, 
            'sunlight_factor': 1.0
        })
        
        # Calculate temperature effect (0.5-1.0)
        temp_diff = abs(weather['temperature'] - crop_features['temp_optimal'])
        temp_effect = max(0.5, 1.0 - (temp_diff / 30.0))
        
        # Calculate water effect (0.5-1.0)
        water_need = crop_features['water_need'] * 200  # Scale to mm of rainfall
        rainfall_diff = abs(weather['rainfall'] - water_need)
        water_effect = max(0.5, 1.0 - (rainfall_diff / 200.0))
        
        # Calculate soil suitability (0.6-1.0)
        soil_suitability = 0.6 + (0.4 * (
            soil_features['fertility'] * 0.4 +
            soil_features['drainage'] * 0.3 +
            soil_features['nutrient_retention'] * 0.3
        ))
        
        # Apply season factors
        season_effect = (
            season_factors['temp_factor'] * 0.4 +
            season_factors['rainfall_factor'] * 0.4 +
            season_factors['sunlight_factor'] * 0.2
        )
        
        # Calculate final yield
        land_area_hectares = float(area_of_land) / 2.47105  # Convert acres to hectares
        
        yield_per_hectare = base_yield * temp_effect * water_effect * soil_suitability * season_effect
        total_yield = round(yield_per_hectare * land_area_hectares)
        
        # Add small random variation (±5%) for realistic predictions
        # Lower variation than before to make predictions more stable
        variation = 0.95 + (np.random.rand() * 0.1)  # 0.95-1.05
        total_yield = round(total_yield * variation)
        
        return total_yield
    
    def _find_suitable_crops(self, soil_type, season, weather):
        """Find crops suitable for the given conditions"""
        suitable_crops = []
        
        soil_features = SOIL_TYPES.get(soil_type, {
            'fertility': 0.7, 
            'drainage': 0.7, 
            'nutrient_retention': 0.7
        })
        
        season_factors = SEASON_FACTORS.get(season, {
            'temp_factor': 1.0, 
            'rainfall_factor': 1.0, 
            'sunlight_factor': 1.0
        })
        
        # Calculate suitability scores for each crop
        crop_scores = {}
        for crop, features in CROP_FEATURES.items():
            # Temperature suitability
            temp_diff = abs(weather['temperature'] - features['temp_optimal'])
            temp_score = max(0, 1.0 - (temp_diff / 20.0))
            
            # Water suitability
            water_need = features['water_need'] * 200  # Scale to mm of rainfall
            water_diff = abs(weather['rainfall'] - water_need)
            water_score = max(0, 1.0 - (water_diff / 150.0))
            
            # Soil suitability
            soil_compatibility = features['soil_preference'] * (
                soil_features['fertility'] * 0.4 +
                soil_features['drainage'] * 0.3 +
                soil_features['nutrient_retention'] * 0.3
            )
            
            # Season suitability
            season_compatibility = (
                season_factors['temp_factor'] * (1 - abs(features['temp_optimal'] - 25) / 10) * 0.4 +
                season_factors['rainfall_factor'] * features['water_need'] * 0.4 +
                season_factors['sunlight_factor'] * 0.2
            )
            
            # Overall score
            overall_score = (
                temp_score * 0.3 +
                water_score * 0.3 +
                soil_compatibility * 0.2 +
                season_compatibility * 0.2
            )
            
            crop_scores[crop] = overall_score
        
        # Get the top 3 crops
        sorted_crops = sorted(crop_scores.items(), key=lambda x: x[1], reverse=True)
        suitable_crops = [crop for crop, score in sorted_crops[:3]]
        
        return suitable_crops
    
    def predict_yield(self, data):
        """Predict yield based on input data"""
        try:
            crop = data['crop']
            season = data['season']
            soil_type = data['soil_type']
            area_of_land = float(data['area_of_land'])
            latitude = float(data['latitude'])
            longitude = float(data['longitude'])
            
            # Get weather data based on location
            weather = self._get_weather_data(latitude, longitude)
            
            # Add location details if available
            location_details = data.get('location_details', {})
            
            if self.is_mock:
                # Use feature-based prediction when no trained model is available
                predicted_yield = self._calculate_yield_feature_based(
                    crop, season, soil_type, area_of_land, weather
                )
                confidence = round(0.7 + (np.random.rand() * 0.2), 2)  # 0.7-0.9
            else:
                # When we have a trained model
                # Convert inputs to features the model understands
                features = self._prepare_features(crop, season, soil_type, area_of_land, weather)
                predicted_yield = int(self.model.predict([features])[0])
                confidence = round(0.8 + (np.random.rand() * 0.15), 2)  # 0.8-0.95
            
            # Find suitable crops
            suggested_crops = self._find_suitable_crops(soil_type, season, weather)
            # Remove the current crop from suggestions if present
            if crop in suggested_crops:
                suggested_crops.remove(crop)
                
            # Add another suggestion if we removed the current crop
            if len(suggested_crops) < 3:
                all_crops = list(CROP_FEATURES.keys())
                for potential_crop in all_crops:
                    if potential_crop not in suggested_crops and potential_crop != crop:
                        suggested_crops.append(potential_crop)
                        break
            
            # Add additional information about the prediction
            weather_source = weather.pop('source', 'unknown')
            
            result = {
                'predicted_yield_kg': predicted_yield,
                'suggested_crops': suggested_crops[:3],  # Limit to 3 suggestions
                'confidence': confidence,
                'weather': weather,
                'is_mock': self.is_mock,
                'weather_source': weather_source,
                'location_details': location_details
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error in yield prediction: {str(e)}")
            raise
    
    def _prepare_features(self, crop, season, soil_type, area_of_land, weather):
        """Prepare features for model input"""
        # This would normally transform categorical variables and normalize features
        # For the mock implementation, we'll just create a feature vector
        
        # One-hot encode crop (simplified)
        crops = list(CROP_FEATURES.keys())
        crop_feature = [1 if c == crop else 0 for c in crops]
        
        # One-hot encode season
        seasons = list(SEASON_FACTORS.keys())
        season_feature = [1 if s == season else 0 for s in seasons]
        
        # One-hot encode soil type
        soils = list(SOIL_TYPES.keys())
        soil_feature = [1 if s == soil_type else 0 for s in soils]
        
        # Combine all features
        features = [
            area_of_land / 10,  # Normalize area
            weather['temperature'] / 50,  # Normalize temperature
            weather['humidity'] / 100,  # Normalize humidity
            weather['rainfall'] / 200,  # Normalize rainfall
        ]
        
        # Add one-hot encoded features
        features.extend(crop_feature)
        features.extend(season_feature)
        features.extend(soil_feature)
        
        return features

# Initialize the model
def initialize_model():
    """Initialize and return the yield prediction model"""
    logger.info("Initializing yield prediction model")
    model = YieldPredictionModel()
    return model 