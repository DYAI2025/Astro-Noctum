# Basis Image: Python 3.11 Slim (klein und effizient)
FROM python:3.11-slim

# System-Dependencies für C++ Compilation (Swisseph)
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    && rm -rf /var/lib/apt/lists/*

# Arbeitsverzeichnis
WORKDIR /app

COPY assets /app/assets

# Dependencies kopieren und installieren
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Source Code kopieren (wird der User manuell machen oder wir bereiten es vor)
COPY . .

# Port freigeben (Default Fly.io ist 8080)
EXPOSE 8080

# API starten
CMD ["python", "main.py"]
