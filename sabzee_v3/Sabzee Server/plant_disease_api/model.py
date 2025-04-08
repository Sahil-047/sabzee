import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import requests
from io import BytesIO
import logging
import random

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Define the model architecture (same as in the notebook)
class PlantDiseaseModel(nn.Module):
    def __init__(self, num_classes=38):
        super().__init__()
        self.network = models.resnet34(weights=None)
        num_ftrs = self.network.fc.in_features
        self.network.fc = nn.Linear(num_ftrs, num_classes)
        
    def forward(self, xb):
        out = self.network(xb)
        return out

# Helper function to load image from URL
def load_image_from_url(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        img = Image.open(BytesIO(response.content)).convert('RGB')
        return img
    except requests.exceptions.RequestException as e:
        logger.error(f"Error loading image from URL: {str(e)}")
        raise Exception(f"Failed to load image from URL: {str(e)}")
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise Exception(f"Failed to process image: {str(e)}")

# Classes for the model (based on common plant diseases)
# Note: These class names should match exactly with what the model was trained on
CLASS_NAMES = [
    'Apple___Apple_scab',
    'Apple___Black_rot',
    'Apple___Cedar_apple_rust',
    'Apple___healthy',
    'Blueberry___healthy',
    'Cherry___healthy',
    'Cherry___Powdery_mildew',
    'Corn___Cercospora_leaf_spot Gray_leaf_spot',
    'Corn___Common_rust',
    'Corn___healthy',
    'Corn___Northern_Leaf_Blight',
    'Grape___Black_rot',
    'Grape___Esca_(Black_Measles)',
    'Grape___healthy',
    'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
    'Orange___Haunglongbing_(Citrus_greening)',
    'Peach___Bacterial_spot',
    'Peach___healthy',
    'Pepper,_bell___Bacterial_spot',
    'Pepper,_bell___healthy',
    'Potato___Early_blight',
    'Potato___healthy',
    'Potato___Late_blight',
    'Raspberry___healthy',
    'Soybean___healthy',
    'Squash___Powdery_mildew',
    'Strawberry___healthy',
    'Strawberry___Leaf_scorch',
    'Tomato___Bacterial_spot',
    'Tomato___Early_blight',
    'Tomato___healthy',
    'Tomato___Late_blight',
    'Tomato___Leaf_Mold',
    'Tomato___Septoria_leaf_spot',
    'Tomato___Spider_mites Two-spotted_spider_mite',
    'Tomato___Target_Spot',
    'Tomato___Tomato_mosaic_virus',
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus'
]

# Data transforms - resize and convert to tensor for model input
def get_transforms():
    return transforms.Compose([
        transforms.Resize(size=128),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])  # ImageNet normalization
    ])

# Load model
def load_model(model_path):
    try:
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info(f"Using device: {device}")
        
        model = PlantDiseaseModel(num_classes=len(CLASS_NAMES))
        logger.info("Model architecture created")
        
        model.load_state_dict(torch.load(model_path, map_location=device))
        logger.info("Model weights loaded successfully")
        
        model = model.to(device)
        model.eval()
        logger.info("Model set to evaluation mode")
        
        return model, device
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        raise

# Predict disease
def predict_disease(image_url, model, device):
    try:
        logger.info(f"Loading image from URL: {image_url}")
        image = load_image_from_url(image_url)
        
        logger.info("Transforming image for model input")
        transform = get_transforms()
        img_tensor = transform(image).unsqueeze(0).to(device)
        
        logger.info("Running prediction")
        with torch.no_grad():
            outputs = model(img_tensor)
            _, preds = torch.max(outputs, 1)
            predicted_idx = preds[0].item()
            
            if predicted_idx >= len(CLASS_NAMES):
                raise ValueError(f"Model predicted class index {predicted_idx} which is out of range for {len(CLASS_NAMES)} classes")
                
            predicted_class = CLASS_NAMES[predicted_idx]
            
            # Get confidence scores
            confidence_scores = torch.nn.functional.softmax(outputs, dim=1)[0]
            confidence = confidence_scores[predicted_idx].item()
        
        logger.info(f"Prediction complete: {predicted_class} with confidence {confidence:.4f}")
        return predicted_class, confidence
        
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        raise

# Mock prediction function for fallback
def mock_predict_disease(image_url):
    logger.info(f"Using mock prediction for image: {image_url}")
    # Return a random disease from the class names with a medium confidence level
    random_idx = random.randint(0, len(CLASS_NAMES) - 1)
    predicted_class = CLASS_NAMES[random_idx]
    confidence = random.uniform(0.7, 0.9)
    
    logger.info(f"Mock prediction: {predicted_class} with confidence {confidence:.4f}")
    return predicted_class, confidence 