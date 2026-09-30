"""
=============================================================================
CropGuard Pro - Dataset Reduction & Compression Script
=============================================================================
Purpose : Reduce the PlantVillage dataset from ~1.3 GB to ~150-250 MB
          by selecting 15 target classes, sampling 400 images per class,
          resizing to 224×224, and compressing into a ZIP file.
Platform : Google Colab
=============================================================================
"""

import os
import shutil
import random
import zipfile
from PIL import Image

# ── 1. CONFIGURATION ────────────────────────────────────────────────────────

# Root path of the full PlantVillage dataset (on Colab)
SOURCE_DIR = "/content/PlantVillage"

# Destination folder for the reduced dataset
DEST_DIR = "/content/PlantVillage_small"

# Output ZIP file name
ZIP_NAME = "PlantVillage_small.zip"
ZIP_PATH = f"/content/{ZIP_NAME}"

# Target image dimensions (pixels)
IMG_SIZE = (224, 224)

# Number of images to sample per class
IMAGES_PER_CLASS = 400

# ── 2. TARGET DISEASE CLASSES ────────────────────────────────────────────────

TARGET_CLASSES = [
    "Pepper__bell___Bacterial_spot",
    "Pepper__bell___healthy",
    "Potato___Early_blight",
    "Potato___healthy",
    "Potato___Late_blight",
    "Tomato_Bacterial_spot",
    "Tomato_Early_blight",
    "Tomato_healthy",
    "Tomato_Late_blight",
    "Tomato_Leaf_Mold",
    "Tomato_Septoria_leaf_spot",
    "Tomato_Spider_mites_Two_spotted_spider_mite",
    "Tomato__Target_Spot",
    "Tomato__Tomato_mosaic_virus",
    "Tomato__Tomato_YellowLeaf__Curl_Virus",
]

# ── 3. HELPER: SUPPORTED IMAGE EXTENSIONS ───────────────────────────────────

VALID_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"}


def is_image(filename: str) -> bool:
    """Return True if the file has a recognised image extension."""
    return os.path.splitext(filename)[1].lower() in VALID_EXTS


# ── 4. CLEAN / CREATE DESTINATION DIRECTORY ─────────────────────────────────

if os.path.exists(DEST_DIR):
    print(f"[INFO] Removing existing destination: {DEST_DIR}")
    shutil.rmtree(DEST_DIR)

os.makedirs(DEST_DIR, exist_ok=True)
print(f"[INFO] Created destination directory: {DEST_DIR}\n")

# ── 5. PROCESS EACH TARGET CLASS ─────────────────────────────────────────────

class_counts = {}   # {class_name: number_of_images_copied}

for class_name in TARGET_CLASSES:
    src_class_path = os.path.join(SOURCE_DIR, class_name)

    # ── 5a. Validate source class folder ──
    if not os.path.isdir(src_class_path):
        print(f"[WARNING] Class folder not found, skipping: {class_name}")
        class_counts[class_name] = 0
        continue

    # ── 5b. Collect all image files in the class folder ──
    all_images = [
        f for f in os.listdir(src_class_path) if is_image(f)
    ]

    if len(all_images) == 0:
        print(f"[WARNING] No images found in: {class_name}")
        class_counts[class_name] = 0
        continue

    # ── 5c. Randomly sample up to IMAGES_PER_CLASS images ──
    random.seed(42)   # Fixed seed for reproducibility
    selected_images = random.sample(
        all_images, min(IMAGES_PER_CLASS, len(all_images))
    )

    # ── 5d. Create destination sub-folder ──
    dest_class_path = os.path.join(DEST_DIR, class_name)
    os.makedirs(dest_class_path, exist_ok=True)

    # ── 5e. Open, resize to 224×224 RGB, and save each image ──
    copied = 0
    for img_filename in selected_images:
        src_img_path = os.path.join(src_class_path, img_filename)
        dest_img_path = os.path.join(dest_class_path, img_filename)

        try:
            with Image.open(src_img_path) as img:
                # Convert to RGB (handles grayscale / RGBA / palette images)
                img_rgb = img.convert("RGB")
                # Resize using high-quality Lanczos resampling
                img_resized = img_rgb.resize(IMG_SIZE, Image.LANCZOS)
                # Save as JPEG with quality 90 to balance size vs quality
                dest_img_path = os.path.splitext(dest_img_path)[0] + ".jpg"
                img_resized.save(dest_img_path, "JPEG", quality=90, optimize=True)
                copied += 1
        except Exception as e:
            print(f"  [ERROR] Could not process {img_filename}: {e}")

    class_counts[class_name] = copied
    print(f"  [OK] {class_name:<55} → {copied} images copied")

# ── 6. PRINT PER-CLASS SUMMARY ───────────────────────────────────────────────

print("\n" + "=" * 65)
print(f"{'CLASS NAME':<55} {'IMAGES':>6}")
print("=" * 65)
total_images = 0
for cls, cnt in class_counts.items():
    print(f"{cls:<55} {cnt:>6}")
    total_images += cnt
print("-" * 65)
print(f"{'TOTAL':<55} {total_images:>6}")
print("=" * 65)

# ── 7. COMPRESS INTO ZIP WITH MAXIMUM COMPRESSION ────────────────────────────

print(f"\n[INFO] Compressing {DEST_DIR} → {ZIP_PATH}  (this may take a minute…)")

with zipfile.ZipFile(
    ZIP_PATH, mode="w", compression=zipfile.ZIP_DEFLATED, compresslevel=9
) as zf:
    for root, dirs, files in os.walk(DEST_DIR):
        for file in files:
            abs_path = os.path.join(root, file)
            # Store relative path inside the ZIP so it unpacks neatly
            arcname = os.path.relpath(abs_path, start=os.path.dirname(DEST_DIR))
            zf.write(abs_path, arcname)

print("[INFO] Compression complete!\n")

# ── 8. PRINT FINAL SIZE STATISTICS ──────────────────────────────────────────

folder_size_bytes = sum(
    os.path.getsize(os.path.join(root, f))
    for root, dirs, files in os.walk(DEST_DIR)
    for f in files
)
zip_size_bytes = os.path.getsize(ZIP_PATH)

print(f"  Reduced dataset folder size : {folder_size_bytes / (1024**2):.1f} MB")
print(f"  Compressed ZIP file size    : {zip_size_bytes   / (1024**2):.1f} MB")
print(f"  Total classes kept          : {len([c for c,n in class_counts.items() if n > 0])}/{len(TARGET_CLASSES)}")
print(f"  Total images in dataset     : {total_images}")

# ── 9. DOWNLOAD THE ZIP FROM GOOGLE COLAB ────────────────────────────────────

print("\n[INFO] Run the following cell in Colab to download the ZIP:")
print("─" * 50)
print("  from google.colab import files")
print(f'  files.download("{ZIP_PATH}")')
print("─" * 50)

# Or execute it directly (uncomment if you want auto-download):
# from google.colab import files
# files.download(ZIP_PATH)
