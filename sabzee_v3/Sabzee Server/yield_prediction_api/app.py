from flask import Flask, request, jsonify
from flask_cors import CORS
from model import initialize_model
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global variables
yield_model = None

# Load model at startup
@app.before_first_request
def load_model_before_first_request():
    global yield_model
    try:
        logger.info("Loading yield prediction model")
        yield_model = initialize_model()
        logger.info("Yield prediction model loaded successfully")
    except Exception as e:
        logger.error(f"Error loading yield prediction model: {str(e)}")
        raise

@app.route('/predict', methods=['POST'])
def predict():
    if not request.json:
        return jsonify({"error": "No data provided"}), 400
    
    required_fields = ['latitude', 'longitude', 'crop', 'season', 'area_of_land', 'soil_type']
    for field in required_fields:
        if field not in request.json:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    try:
        logger.info(f"Received yield prediction request: {request.json}")
        
        # Call the prediction model
        result = yield_model.predict_yield(request.json)
        
        prediction_result = {
            "predicted_yield_kg": result['predicted_yield_kg'],
            "suggested_crops": result['suggested_crops'],
            "confidence": result['confidence'],
            "is_mock": result['is_mock'],
            "weather": {
                "temperature": result['weather']['temperature'],
                "humidity": result['weather']['humidity'],
                "rainfall": result['weather']['rainfall']
            }
        }
        
        logger.info(f"Prediction result: {prediction_result}")
        return jsonify(prediction_result)
        
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    if yield_model:
        return jsonify({
            "status": "healthy",
            "using_mock": yield_model.is_mock
        }), 200
    else:
        return jsonify({
            "status": "initializing",
            "using_mock": True
        }), 200

if __name__ == '__main__':
    try:
        logger.info("Starting Flask server on port 5002")
        app.run(host='0.0.0.0', port=5002, debug=True)
    except Exception as e:
        logger.error(f"Error starting server: {str(e)}") 