import tensorflow as tf

model = tf.keras.models.load_model("emotion_detector_model.h5")

converter = tf.lite.TFLiteConverter.from_keras_model(model)
tflite_model = converter.convert()

with open("emotion_model.tflite", "wb") as f:
    f.write(tflite_model)

print("Done! Saved as emotion_model.tflite")
