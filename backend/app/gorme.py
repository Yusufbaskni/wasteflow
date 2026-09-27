import io
import numpy as np
from PIL import Image
from ultralytics import YOLO

# Hafif nano model yüklenir
model = YOLO("yolov8n.pt")

WASTE_CLASSES = {
    "bottle": "Plastik / Cam Şişe",
    "cup": "Plastik / Kağıt Bardak",
    "can": "Metal Kutu",
    "box": "Karton / Kağıt Kutusu"
}

class VisionService:
    @staticmethod
    def analyze_waste_image(image_bytes: bytes) -> dict:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # YOLOv8 çıkarımı
        results = model(image)
        detected_materials = []
        highest_conf = 0.0

        for result in results:
            for box in result.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                class_name = model.names[cls_id]

                if conf > 0.4:
                    material_label = WASTE_CLASSES.get(class_name, class_name)
                    detected_materials.append(material_label)
                    if conf > highest_conf:
                        highest_conf = conf

        # Hibrit Karar Yapısı (YOLOv8 -> NumPy Fallback)
        if detected_materials:
            primary_material = detected_materials[0]
            purity = round(highest_conf * 100, 2)
            method = "YOLOv8 Object Detection"
        else:
            img_array = np.array(image)
            avg_color = img_array.mean(axis=(0, 1))
            std_dev = img_array.std()

            brightness = float(np.mean(avg_color))
            purity = round(min(100.0, float(std_dev * 1.5)), 2)
            
            if brightness > 180:
                primary_material = "Cam / Açık Renkli Plastik"
            elif brightness < 70:
                primary_material = "Organik / Koyu Atık"
            else:
                primary_material = "Kağıt / Karışık Ambalaj"

            method = "NumPy Pixel Matrix Analysis (Fallback)"

        return {
            "primary_material": primary_material,
            "purity_score": purity,
            "analysis_method": method,
            "detected_objects": list(set(detected_materials))
        }
