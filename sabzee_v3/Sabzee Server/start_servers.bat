@echo off
echo Starting the Sabzee Server Application...

echo.
echo Starting the Plant Disease Detection API...
start cmd /k "cd plant_disease_api && python run_api.py"

echo.
echo Starting the Yield Prediction API...
start cmd /k "cd yield_prediction_api && python run_api.py"

echo.
echo Starting the Node.js Server...
npm run dev

echo.
echo All servers should now be running. If you encounter any issues:
echo 1. Check if Python 3.x is installed
echo 2. Check if all dependencies are installed
echo 3. If the APIs fail, the application will still work with mock predictions
echo.
echo Press Ctrl+C to stop the servers 