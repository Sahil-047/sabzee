# Plant Disease Detection API

This is a Flask-based API that uses a PyTorch model to detect plant diseases from images. The API is designed to be used with the Sabzee web application.

## Requirements

- Python 3.7 or higher
- PyTorch
- Flask
- Other dependencies listed in `requirements.txt`

## Setup

1. Ensure you have Python installed on your system.
2. Place the `plantDisease.pth` model file in one of these locations:
   - In the current directory (`Sabzee Server/plant_disease_api/`)
   - One level up (`Sabzee Server/`)
   - Two levels up (root project folder)
   - At `C:/Users/Muskaan/Downloads/Client/plantDisease.pth`

3. Dependencies will be installed automatically when you run the API using the provided script.

## Running the API

### Option 1: Using the Python wrapper script (Recommended)

Simply run the Python script that handles dependencies and starts the API:

```
python run_api.py
```

### Option 2: Manual start

If you prefer to install dependencies separately:

```
pip install -r requirements.txt
python app.py
```

The API will start on `http://localhost:5001`.

## API Endpoints

### Health Check

```
GET /health
```

Returns the status of the API.

### Predict Plant Disease

```
POST /predict
```

Input (JSON):
```json
{
  "image_url": "https://example.com/path/to/image.jpg"
}
```

Output (JSON):
```json
{
  "prediction": "Bacterial spot",
  "crop": "Tomato",
  "confidence": 0.9458
}
```

## Model Information

The model is a ResNet34-based architecture trained to identify 38 different classes of plant diseases across various crops. It's capable of identifying diseases in:

- Apple
- Blueberry
- Cherry
- Corn
- Grape
- Orange
- Peach
- Pepper
- Potato
- Raspberry
- Soybean
- Squash
- Strawberry
- Tomato

## About Fallback Mode

This API is designed to be resilient. If the PyTorch model fails to load or dependencies fail to install properly, the API will automatically switch to a "mock prediction" mode. In this mode:

1. The API will continue to operate normally
2. It will return random predictions from the list of known plant diseases
3. API responses will include an `is_mock` field set to `true` to indicate mock data
4. The `/health` endpoint will show `"using_mock": true` when in fallback mode

This ensures that your application can continue to function even when there are issues with the machine learning model or its dependencies.

## Troubleshooting

1. **Model not found**: Make sure the `plantDisease.pth` file is in one of the specified locations.
2. **Port already in use**: Change the port in `app.py` if port 5001 is already in use.
3. **Import errors**: Make sure all dependencies are installed by running `pip install -r requirements.txt`.
4. **CUDA errors**: If you encounter CUDA-related errors, the model will automatically fallback to CPU.
5. **Script errors**: If you encounter errors with the batch file, try running the Python script directly using `python run_api.py`.
6. **Installation Problems**: If you see dependency conflicts, try running the API anyway - it will fall back to mock mode.
7. **Model Loading Failures**: If the model file isn't found or can't be loaded, the API will continue in mock mode.
8. **PyTorch Version Issues**: If you're getting PyTorch/torchvision errors, you can try installing the latest versions manually:
   ```
   pip install torch torchvision
   ```

## Integration with Node.js Backend

The API is designed to be called from the Node.js backend using the following endpoint:

```javascript
axios.post('http://localhost:5001/predict', {
  image_url: imageUrl
});
```

The response can then be processed and stored in the MongoDB database. 