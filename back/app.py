# backend/app.py
import os
import io
import re
import base64
from PIL import Image
import numpy as np
import cv2
from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model

# --- Configuration ---
MODEL_PATH = "emotion_detector_model.h5"  # place ton modèle ici
# Ordre des classes — adapte si ton modèle a un autre ordre
CLASS_LABELS = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
# image size attendu par ton modèle (ici 48x48)
IMG_SIZE = 48

app = Flask(__name__)
CORS(app)

# --- Charger le modèle une fois ---
print("Loading model...", MODEL_PATH)
model = load_model(MODEL_PATH)
print("Model loaded.")

# charger cascade haar pour detection visage (fourni par OpenCV)
haar_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
face_cascade = cv2.CascadeClassifier(haar_path)

def base64_to_cv2_img(data_url):
    """Convert a base64 dataURL to an OpenCV BGR image."""
    # data_url: "data:image/jpeg;base64,/9j/4AAQ..."
    header, encoded = data_url.split(',', 1)
    data = base64.b64decode(encoded)
    image = Image.open(io.BytesIO(data)).convert('RGB')
    return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

def detect_and_crop_face(bgr_img):
    """Detect face and return cropped grayscale image resized to IMG_SIZE."""
    gray = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2GRAY)
    # detectMultiScale params can be tuned
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30,30))
    if len(faces) == 0:
        return None
    # take the largest face
    faces = sorted(faces, key=lambda x: x[2]*x[3], reverse=True)
    (x, y, w, h) = faces[0]
    # add small margin
    margin = int(0.2 * w)
    x1 = max(0, x - margin)
    y1 = max(0, y - margin)
    x2 = min(gray.shape[1], x + w + margin)
    y2 = min(gray.shape[0], y + h + margin)
    face = gray[y1:y2, x1:x2]
    face_resized = cv2.resize(face, (IMG_SIZE, IMG_SIZE))
    return face_resized

def preprocess_for_model(gray_img):
    """Normalize and shape as model expects. returns shape (1, IMG_SIZE, IMG_SIZE, 1)"""
    arr = gray_img.astype('float32') / 255.0
    arr = np.expand_dims(arr, axis=-1)  # (H,W,1)
    arr = np.expand_dims(arr, axis=0)   # (1,H,W,1)
    return arr

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({"error": "No image provided"}), 400
        data_url = data['image']
        # validate base64
        if not data_url.startswith("data:image"):
            return jsonify({"error": "Invalid image data"}), 400

        # convert
        bgr = base64_to_cv2_img(data_url)

        # detect face & crop
        face_gray = detect_and_crop_face(bgr)
        if face_gray is None:
            return jsonify({"error": "No face detected"}), 400

        # preprocess
        X = preprocess_for_model(face_gray)

        # predict
        preds = model.predict(X)  # shape (1, n_classes)
        prob = float(np.max(preds))
        idx = int(np.argmax(preds))
        label = CLASS_LABELS[idx] if idx < len(CLASS_LABELS) else str(idx)

        return jsonify({
            "emotion": label,
            "confidence": round(prob * 100, 2)
        })

    except Exception as e:
        print("Error in /predict:", e)
        return jsonify({"error": str(e)}), 500
    
@app.route("/health")
def health():
    return {"status": "ok"}, 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
