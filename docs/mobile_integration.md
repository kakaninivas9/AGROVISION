# CropGuard Pro — Mobile Integration Guide

## Overview

There are **three ways** to integrate CropGuard Pro's AI disease detection into a mobile app:

| Option | Tech | Best For |
|--------|------|----------|
| A | REST API (Flask + ngrok) | Quick prototypes, Android/iOS apps |
| B | TFLite on-device | Offline farms with no internet |
| C | ThingSpeak polling | Monitoring-only apps |

---

## Option A — REST API Integration

### Android (Java / Kotlin)

```kotlin
// Kotlin — POST leaf image to Flask API
import okhttp3.*
import org.json.JSONObject
import java.io.File

val client = OkHttpClient()

fun predictDisease(imageFile: File, apiUrl: String, callback: (JSONObject?) -> Unit) {
    val requestBody = MultipartBody.Builder()
        .setType(MultipartBody.FORM)
        .addFormDataPart(
            "image",
            imageFile.name,
            RequestBody.create(MediaType.parse("image/jpeg"), imageFile)
        )
        .build()

    val request = Request.Builder()
        .url("$apiUrl/predict")
        .post(requestBody)
        .build()

    client.newCall(request).enqueue(object : Callback {
        override fun onFailure(call: Call, e: IOException) { callback(null) }
        override fun onResponse(call: Call, response: Response) {
            val body = response.body()?.string()
            callback(body?.let { JSONObject(it) })
        }
    })
}

// Usage:
// predictDisease(leafImageFile, "https://your-ngrok-url.ngrok.io") { result ->
//     val label      = result?.getJSONObject("prediction")?.getString("label")
//     val confidence = result?.getJSONObject("prediction")?.getDouble("confidence_pct")
//     val treatment  = result?.getJSONObject("prediction")?.getString("treatment")
// }
```

**Gradle dependency:**
```gradle
implementation 'com.squareup.okhttp3:okhttp:4.12.0'
```

---

### iOS (Swift)

```swift
// Swift — POST leaf image to Flask API
import Foundation
import UIKit

func predictDisease(image: UIImage, apiURL: String, completion: @escaping ([String: Any]?) -> Void) {
    guard let url = URL(string: "\(apiURL)/predict"),
          let imageData = image.jpegData(compressionQuality: 0.8) else { return }

    let boundary = "Boundary-\(UUID().uuidString)"
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

    var body = Data()
    body.append("--\(boundary)\r\n".data(using: .utf8)!)
    body.append("Content-Disposition: form-data; name=\"image\"; filename=\"leaf.jpg\"\r\n".data(using: .utf8)!)
    body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
    body.append(imageData)
    body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
    request.httpBody = body

    URLSession.shared.dataTask(with: request) { data, _, _ in
        let json = data.flatMap { try? JSONSerialization.jsonObject(with: $0) as? [String: Any] }
        DispatchQueue.main.async { completion(json) }
    }.resume()
}

// Usage:
// predictDisease(image: leafUIImage, apiURL: "https://your-ngrok-url.ngrok.io") { result in
//     if let prediction = result?["prediction"] as? [String: Any] {
//         let label     = prediction["label"] as? String
//         let confidence= prediction["confidence_pct"] as? Double
//         let treatment = prediction["treatment"] as? String
//     }
// }
```

---

### React Native (JavaScript)

```javascript
// React Native — POST leaf image using fetch + FormData
import { Camera } from 'expo-camera';

const API_URL = 'https://your-ngrok-url.ngrok.io';

async function predictDisease(imageUri) {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    name: 'leaf.jpg',
    type: 'image/jpeg',
  });

  const response = await fetch(`${API_URL}/predict`, {
    method: 'POST',
    body: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const data = await response.json();
  const { label, confidence_pct, treatment, is_critical } = data.prediction;

  console.log(`Disease: ${label} (${confidence_pct}%)`);
  if (is_critical) alert(`🚨 Critical: ${label}\n${treatment}`);
  return data.prediction;
}
```

---

## Option B — TFLite On-Device (Offline)

For farms with no internet — run inference directly on the phone.

### Android TFLite

```kotlin
import org.tensorflow.lite.Interpreter
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel

// Load model from assets/cropguard_model.tflite
fun loadModel(context: Context): Interpreter {
    val afd = context.assets.openFd("cropguard_model.tflite")
    val channel = FileInputStream(afd.fileDescriptor).channel
    val buffer  = channel.map(FileChannel.MapMode.READ_ONLY, afd.startOffset, afd.declaredLength)
    return Interpreter(buffer)
}

// Run inference
fun predict(interpreter: Interpreter, bitmap: Bitmap): FloatArray {
    val resized    = Bitmap.createScaledBitmap(bitmap, 224, 224, true)
    val inputBuffer= TensorImage.fromBitmap(resized).buffer
    val output     = Array(1) { FloatArray(15) }
    interpreter.run(inputBuffer, output)
    return output[0]   // Returns 15 class probabilities
}
```

**Gradle:**
```gradle
implementation 'org.tensorflow:tensorflow-lite:2.13.0'
implementation 'org.tensorflow:tensorflow-lite-support:0.4.4'
```

### Files to copy into Android project:
- `cropguard_model.tflite` → `app/src/main/assets/`
- `class_labels.json`      → `app/src/main/assets/`

---

## Option C — ThingSpeak Polling (Monitoring Only)

```javascript
// React Native — Poll ThingSpeak for latest AI result
const TS_CHANNEL = 'YOUR_AI_CHANNEL_ID';
const TS_API_KEY = 'YOUR_READ_API_KEY';

async function getLatestPrediction() {
  const url = `https://api.thingspeak.com/channels/${TS_CHANNEL}/feeds.json?api_key=${TS_API_KEY}&results=1`;
  const response = await fetch(url);
  const data     = await response.json();
  const feed     = data.feeds[0];
  return {
    confidence: parseFloat(feed.field1),
    isHealthy : parseInt(feed.field2) === 1,
    label     : feed.status,
  };
}
```

---

## API Response Schema

```json
{
  "success": true,
  "prediction": {
    "class_raw"     : "Tomato_Late_blight",
    "label"         : "Tomato – Late Blight",
    "confidence_pct": 94.7,
    "is_healthy"    : false,
    "is_critical"   : true,
    "treatment"     : "Apply systemic fungicide immediately...",
    "top_5": [
      { "class": "Tomato_Late_blight", "label": "Tomato – Late Blight", "confidence": 94.7 },
      { "class": "Tomato_Early_blight", "label": "Tomato – Early Blight", "confidence": 3.1 }
    ],
    "timestamp": "2026-03-15T08:45:00Z"
  }
}
```

---

## Recommended App Features

| Feature | Implementation |
|---------|---------------|
| Camera capture | expo-camera / CameraX |
| Disease result screen | Label + confidence ring + treatment card |
| Sensor dashboard | Fetch ThingSpeak every 30s |
| Offline mode | TFLite on-device |
| Push notifications | Firebase FCM when critical disease detected |
| History log | SQLite local DB of all scans |
