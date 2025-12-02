import requests
import base64
import json

url = "https://emotion-detector-1-qvrg.onrender.com/predict"

print("Testing backend at:", url)
print("=" * 50)

# Test 1: Send invalid data
print("\nTest 1: Invalid request (no image field)")
try:
    response = requests.post(url, json={}, timeout=10)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

print("\n" + "=" * 50)

# Test 2: Send invalid image data
print("\nTest 2: Invalid image format")
try:
    response = requests.post(url, json={"image": "not_a_valid_image"}, timeout=10)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

print("\n" + "=" * 50)

# Test 3: Send properly formatted but dummy base64
print("\nTest 3: Dummy base64 image (just text)")
try:
    # This is "Hello World" in base64, not a real image
    dummy_base64 = "data:image/jpeg;base64,SGVsbG8gV29ybGQ="
    response = requests.post(url, json={"image": dummy_base64}, timeout=10)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

print("\n" + "=" * 50)

# Test 4: Try with a small actual image
print("\nTest 4: Small actual image")
try:
    # Create a simple 10x10 red image
    from PIL import Image
    import io
    
    # Create a small red image
    img = Image.new('RGB', (10, 10), color='red')
    
    # Save to bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes = img_bytes.getvalue()
    
    # Convert to base64
    encoded = base64.b64encode(img_bytes).decode('utf-8')
    data_url = f"data:image/jpeg;base64,{encoded}"
    
    print(f"Image data URL length: {len(data_url)}")
    
    response = requests.post(url, json={"image": data_url}, timeout=15)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

print("\n" + "=" * 50)
print("All tests completed.")