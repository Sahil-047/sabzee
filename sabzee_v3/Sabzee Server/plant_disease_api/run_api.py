import subprocess
import sys
import os
import time

def main():
    print("Starting Plant Disease Detection API...")
    
    # First try to install dependencies, but continue even if it fails
    print("Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("Dependencies installed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Warning: Failed to install some dependencies: {e}")
        print("Continuing anyway as the API will fall back to mock predictions if needed.")
    except Exception as e:
        print(f"Warning: Unexpected error during dependency installation: {e}")
        print("Continuing anyway as the API will fall back to mock predictions if needed.")
    
    # Give a moment for installations to finalize
    time.sleep(1)
    
    # Run the Flask app
    try:
        print("\nStarting the Flask API...")
        print("API will be available at http://localhost:5001")
        print("Press Ctrl+C to stop the server")
        print("\n-------------------------------------")
        subprocess.check_call([sys.executable, "app.py"])
    except subprocess.CalledProcessError as e:
        print(f"Error running Flask app: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nServer shutdown requested. Stopping...")
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)
        
if __name__ == "__main__":
    main() 