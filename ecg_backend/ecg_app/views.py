from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

import numpy as np
import cv2
from PIL import Image
import tensorflow as tf
import joblib
from tensorflow.keras.models import Model
import warnings

# Optional: suppress LightGBM warning
warnings.filterwarnings("ignore", category=UserWarning)

# Load models globally
cnn_model = tf.keras.models.load_model('/run/media/athithraja/works/project/ECG_Class/ecg_backend/model_files/best_model.h5')
classifier = joblib.load('/run/media/athithraja/works/project/ECG_Class/ecg_backend/model_files/LightGBM_classifier.pkl')

# Use intermediate layer for feature extraction
feature_extractor = Model(inputs=cnn_model.input, outputs=cnn_model.layers[-3].output)

# Preprocessing function
def preprocess_image_cv2(cv2_image, target_size=(227, 227)):
    image = cv2.resize(cv2_image, target_size)
    image = image / 255.0
    image = np.expand_dims(image, axis=0)
    return image

@csrf_exempt
@require_POST
def predict(request):
    print("Request received")

    if 'image' not in request.FILES:
        print("No image found in request.")
        return JsonResponse({'error': 'No image provided'}, status=400)

    image_file = request.FILES['image']
    print(f"Received image: {image_file.name}")

    try:
        # Convert image file to NumPy array
        file_bytes = np.asarray(bytearray(image_file.read()), dtype=np.uint8)
        cv2_image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if cv2_image is None:
            raise ValueError("Unable to decode image")

        preprocessed_image = preprocess_image_cv2(cv2_image)
        image_features = feature_extractor.predict(preprocessed_image)

        # Class label mapping
        class_names = {
            0: "Normal",
            1: "Abnormal Heartbeat",
            2: "Myocardial Infarction",
            3: "History of Myocardial Infarction"
        }

        prediction = classifier.predict(image_features)
        prediction_label = class_names.get(int(prediction[0]), "Unknown")

        print(f"Predicted class: {prediction_label}")
        return JsonResponse({'prediction': prediction_label})

    except Exception as e:
        print(f"Error processing image: {e}")
        return JsonResponse({'error': str(e)}, status=500)
