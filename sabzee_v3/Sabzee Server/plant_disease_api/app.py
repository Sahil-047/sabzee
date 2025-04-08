from flask import Flask, request, jsonify
from flask_cors import CORS
from model import load_model, predict_disease, mock_predict_disease
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global variables
model = None
device = None
use_mock = False

# Load model at startup
@app.before_first_request
def load_model_before_first_request():
    global model, device, use_mock
    try:
        # Try different possible paths for the model
        possible_paths = [
            os.path.abspath('../../plantDisease.pth'),
            os.path.abspath('../plantDisease.pth'),
            os.path.abspath('plantDisease.pth'),
            'C:/Users/Muskaan/Downloads/Client/plantDisease.pth'
        ]
        
        model_path = None
        for path in possible_paths:
            if os.path.exists(path):
                model_path = path
                break
        
        if not model_path:
            logger.warning("Model file not found in any of the expected locations. Using mock predictions.")
            use_mock = True
            return
        
        logger.info(f"Loading model from: {model_path}")
        model, device = load_model(model_path)
        logger.info(f"Model loaded successfully to device: {device}")
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        logger.warning("Using mock predictions as fallback.")
        use_mock = True

@app.route('/predict', methods=['POST'])
def predict():
    if 'image_url' not in request.json:
        return jsonify({"error": "No image URL provided"}), 400
    
    try:
        image_url = request.json['image_url']
        logger.info(f"Received prediction request for image: {image_url}")
        
        if use_mock:
            predicted_class, confidence = mock_predict_disease(image_url)
        else:
            predicted_class, confidence = predict_disease(image_url, model, device)
        
        # Split the class name
        parts = predicted_class.split('___')
        crop = parts[0]
        disease = "healthy" if parts[1].lower() == "healthy" else parts[1].replace('_', ' ')
        
        result = {
            "prediction": disease,
            "crop": crop,
            "confidence": confidence,
            "is_mock": use_mock
        }
        
        logger.info(f"Prediction result: {result}")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        # Fallback to mock prediction if real prediction fails
        try:
            predicted_class, confidence = mock_predict_disease(request.json['image_url'])
            parts = predicted_class.split('___')
            crop = parts[0]
            disease = "healthy" if parts[1].lower() == "healthy" else parts[1].replace('_', ' ')
            
            result = {
                "prediction": disease,
                "crop": crop,
                "confidence": confidence,
                "is_mock": True,
                "error": str(e)
            }
            
            logger.info(f"Fallback to mock prediction: {result}")
            return jsonify(result)
        except Exception as fallback_error:
            return jsonify({"error": str(e), "fallback_error": str(fallback_error)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "using_mock": use_mock}), 200

if __name__ == '__main__':
    try:
        logger.info("Starting Flask server on port 5001")
        app.run(host='0.0.0.0', port=5001, debug=True)
    except Exception as e:
        logger.error(f"Error starting server: {str(e)}") 