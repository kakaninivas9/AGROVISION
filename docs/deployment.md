# CropGuard Pro — Deployment Guide

## Deployment Options

| Environment | Use Case | Difficulty |
|-------------|----------|------------|
| Google Colab + ngrok | Quick demo / development | ⭐ Easy |
| Raspberry Pi | On-farm edge server | ⭐⭐ Medium |
| Cloud VM (AWS/GCP) | Production, always-on | ⭐⭐⭐ Advanced |
| Docker Container | Portable, reproducible | ⭐⭐ Medium |

---

## Option 1 — Google Colab + ngrok (Quickest)

```python
# In Colab — run these cells:

# Cell 1: Install
!pip install -q flask pyngrok tensorflow pillow

# Cell 2: Start API with public URL
from pyngrok import ngrok, conf
conf.get_default().auth_token = "YOUR_NGROK_TOKEN"  # ngrok.com free account

import threading
from api.app import app, load_model_and_labels

load_model_and_labels()
public_url = ngrok.connect(5000)
print(f"🌐 API URL: {public_url}/predict")

flask_thread = threading.Thread(target=lambda: app.run(port=5000, debug=False, use_reloader=False))
flask_thread.daemon = True
flask_thread.start()
```

> ⚠ **Limitation:** Colab sessions expire after ~12 hours.

---

## Option 2 — Raspberry Pi (On-Farm Edge Server)

### Setup

```bash
# On Raspberry Pi (Raspberry Pi OS)
sudo apt update && sudo apt install -y python3-pip python3-venv

# Create virtual environment
python3 -m venv ~/cropguard_env
source ~/cropguard_env/bin/activate

# Install dependencies
pip install flask tensorflow-cpu pillow gunicorn

# Copy project files to Pi (from your PC):
# scp -r CGUARD/ pi@raspberrypi.local:~/
```

### Production run with Gunicorn

```bash
# Start API server (2 workers, port 5000)
cd ~/CGUARD
source ~/cropguard_env/bin/activate
gunicorn -w 2 -b 0.0.0.0:5000 api.app:app
```

### Auto-start on boot (systemd service)

```ini
# /etc/systemd/system/cropguard.service
[Unit]
Description=CropGuard Pro API
After=network.target

[Service]
User=pi
WorkingDirectory=/home/pi/CGUARD
ExecStart=/home/pi/cropguard_env/bin/gunicorn -w 2 -b 0.0.0.0:5000 api.app:app
Restart=always
Environment=CROPGUARD_MODEL=/home/pi/CGUARD/cropguard_output/cropguard_model.h5
Environment=CROPGUARD_LABELS=/home/pi/CGUARD/cropguard_output/class_labels.json

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable cropguard
sudo systemctl start cropguard
sudo systemctl status cropguard
```

### Access from mobile app on same WiFi

```
http://raspberrypi.local:5000/predict
http://192.168.1.XXX:5000/predict    # use Pi's local IP
```

---

## Option 3 — Cloud VM (AWS EC2 / GCP / Azure)

### GCP Cloud Run (Docker — Serverless)

```dockerfile
# Dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir flask gunicorn tensorflow-cpu pillow

COPY api/         ./api/
COPY cropguard_output/ ./cropguard_output/

ENV CROPGUARD_MODEL=/app/cropguard_output/cropguard_model.h5
ENV CROPGUARD_LABELS=/app/cropguard_output/class_labels.json
ENV PORT=8080

EXPOSE 8080
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:8080", "api.app:app"]
```

```bash
# Build and deploy to GCP Cloud Run
gcloud builds submit --tag gcr.io/YOUR_PROJECT/cropguard
gcloud run deploy cropguard \
  --image gcr.io/YOUR_PROJECT/cropguard \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi
```

### AWS EC2 Quick Setup

```bash
# On Ubuntu EC2 instance (t3.medium recommended)
sudo apt update && sudo apt install -y python3-pip nginx

pip3 install flask gunicorn tensorflow-cpu pillow

# Upload project files via scp, then:
gunicorn -w 2 -b 127.0.0.1:5000 api.app:app &

# Configure nginx as reverse proxy
sudo nano /etc/nginx/sites-available/cropguard
```

```nginx
server {
    listen 80;
    server_name your-ec2-public-ip;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 10M;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/cropguard /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

---

## Option 4 — Docker Compose (Local / Server)

```yaml
# docker-compose.yml
version: "3.9"
services:
  cropguard_api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - CROPGUARD_MODEL=/app/cropguard_output/cropguard_model.h5
      - CROPGUARD_LABELS=/app/cropguard_output/class_labels.json
    volumes:
      - ./cropguard_output:/app/cropguard_output:ro
    restart: unless-stopped
```

```bash
docker-compose up -d       # Start
docker-compose logs -f     # View logs
docker-compose down        # Stop
```

---

## IoT Firmware Over-the-Air (OTA) Update

To update `CropGuardPro.ino` without physically connecting to the ESP8266:

```cpp
// Add to CropGuardPro.ino
#include <ESP8266HTTPUpdateServer.h>
#include <ESP8266WebServer.h>

ESP8266WebServer httpServer(8080);
ESP8266HTTPUpdateServer httpUpdater;

// In setup():
httpUpdater.setup(&httpServer);
httpServer.begin();

// In loop():
httpServer.handleClient();
```

Then upload new `.bin` via: `http://ESP8266_IP:8080/update`

---

## Security Checklist

- [ ] Set `CROPGUARD_API_KEY` env variable to protect `/predict`
- [ ] Use HTTPS (Let's Encrypt via certbot on cloud VM)
- [ ] Restrict CORS to known origins
- [ ] Rate-limit requests (max 30/minute per IP)
- [ ] Keep model file outside web root

---

## Performance Benchmarks

| Hardware | Inference Time | Throughput |
|----------|---------------|-----------|
| Google Colab GPU | ~35 ms | ~28 req/sec |
| Raspberry Pi 4 (CPU) | ~2.5 sec | ~0.4 req/sec |
| EC2 t3.medium (CPU) | ~800 ms | ~1.2 req/sec |
| TFLite on Android | ~200 ms | ~5 req/sec |
