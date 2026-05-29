import re
import joblib
import pandas as pd

from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


MODEL_PATH = "models/triage_model.joblib"


def metni_temizle(deger):
    if deger is None:
        return ""

    deger = str(deger).lower()
    deger = re.sub(r"[^a-zA-Z0-9\s]", " ", deger)
    deger = re.sub(r"\s+", " ", deger).strip()

    return deger


def model_paketini_yukle():
    try:
        paket = joblib.load(MODEL_PATH)
        return paket
    except FileNotFoundError:
        raise RuntimeError(
            "Model dosyası bulunamadı. Önce 'python src/modeli_egit.py' komutunu çalıştırmalısın."
        )


kayit_paketi = model_paketini_yukle()

model = kayit_paketi["model"]
ozellikler = kayit_paketi.get("ozellikler") or kayit_paketi.get("features")

if ozellikler is None:
    raise RuntimeError("Model paketinde özellik listesi bulunamadı.")


app = FastAPI(
    title="NLP Tabanlı Otomatik Triaj API",
    description="Hasta şikayeti ve klinik bilgilere göre triaj sınıfı tahmini yapar.",
    version="1.0.0"
)


# React Native uygulamasının API'ye bağlanabilmesi için CORS açıldı.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TriageRequest(BaseModel):
    complaint: str

    age: Optional[float] = None
    patients_number_per_hour: Optional[float] = None
    nrs_pain: Optional[float] = None

    sbp: Optional[float] = None
    dbp: Optional[float] = None
    hr: Optional[float] = None
    rr: Optional[float] = None
    bt: Optional[float] = None
    saturation: Optional[float] = None

    length_of_stay_min: Optional[float] = None

    group: Optional[str] = None
    sex: Optional[str] = None
    arrival_mode: Optional[str] = None
    injury: Optional[str] = None
    mental: Optional[str] = None
    pain: Optional[str] = None


def triaj_bilgisi_getir(label):
    bilgiler = {
        "red": {
            "renk": "Kırmızı",
            "aciliyet": "Çok acil",
            "bekleme_suresi": "0-5 dakika",
            "oneri": "Hasta en kısa sürede sağlık personeline yönlendirilmelidir."
        },
        "yellow": {
            "renk": "Sarı",
            "aciliyet": "Orta acil",
            "bekleme_suresi": "10-30 dakika",
            "oneri": "Hasta öncelikli bekleme listesine alınmalıdır."
        },
        "green": {
            "renk": "Yeşil",
            "aciliyet": "Daha az acil",
            "bekleme_suresi": "30-90 dakika",
            "oneri": "Hasta standart bekleme sırasına alınabilir."
        }
    }

    return bilgiler.get(label, {
        "renk": "Bilinmeyen",
        "aciliyet": "Bilinmeyen",
        "bekleme_suresi": "Belirsiz",
        "oneri": "Sağlık personeli tarafından manuel değerlendirme yapılmalıdır."
    })


def riskli_ifadeleri_bul(text):
    text = text.lower()

    risk_sozlugu = {
        "chest pain": "Göğüs ağrısı",
        "shortness of breath": "Nefes darlığı",
        "difficulty breathing": "Nefes alma güçlüğü",
        "unconscious": "Bilinç kaybı",
        "loss of consciousness": "Bilinç kaybı",
        "seizure": "Nöbet",
        "stroke": "İnme şüphesi",
        "bleeding": "Kanama",
        "severe pain": "Şiddetli ağrı",
        "fever": "Ateş",
        "dizziness": "Baş dönmesi",
        "vomiting": "Kusma",
        "trauma": "Travma",
        "burn": "Yanık",
        "head injury": "Kafa travması"
    }

    bulunanlar = []

    for ingilizce, turkce in risk_sozlugu.items():
        if ingilizce in text:
            bulunanlar.append(turkce)

    return bulunanlar


def request_to_dataframe(request: TriageRequest):
    veri = {}

    # Model hangi özellikleri bekliyorsa hepsini önce None yapıyoruz.
    for ozellik in ozellikler:
        veri[ozellik] = None

    # Model eğitilirken şikayet sütunu "text" olarak kaydedilmişti.
    veri["text"] = metni_temizle(request.complaint)

    request_dict = request.model_dump()

    # API'ye gelen alanlardan modelin beklediklerini dolduruyoruz.
    for key, value in request_dict.items():
        if key in veri:
            veri[key] = value

    df = pd.DataFrame([veri])

    return df[ozellikler]


@app.get("/")
def ana_sayfa():
    return {
        "mesaj": "NLP Tabanlı Otomatik Triaj API çalışıyor.",
        "endpointler": {
            "dokumantasyon": "/docs",
            "saglik_kontrolu": "/health",
            "model_ozellikleri": "/features",
            "tahmin": "/predict"
        }
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "model_yuklendi": True,
        "kullanilan_ozellik_sayisi": len(ozellikler)
    }


@app.get("/features")
def features():
    return {
        "modelin_bekledigi_ozellikler": ozellikler
    }


@app.post("/predict")
def predict(request: TriageRequest):
    if request.complaint is None or len(request.complaint.strip()) == 0:
        raise HTTPException(status_code=400, detail="Hasta şikayeti boş olamaz.")

    input_df = request_to_dataframe(request)

    tahmin = model.predict(input_df)[0]
    triaj_bilgisi = triaj_bilgisi_getir(tahmin)

    olasiliklar: Dict[str, Any] = {}

    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(input_df)[0]
        siniflar = model.classes_

        for sinif, olasilik in zip(siniflar, proba):
            olasiliklar[sinif] = round(float(olasilik), 4)

    riskli_ifadeler = riskli_ifadeleri_bul(request.complaint)

    return {
        "girilen_sikayet": request.complaint,
        "tahmin_edilen_sinif": tahmin,
        "triaj_rengi": triaj_bilgisi["renk"],
        "aciliyet": triaj_bilgisi["aciliyet"],
        "tahmini_bekleme_suresi": triaj_bilgisi["bekleme_suresi"],
        "oneri": triaj_bilgisi["oneri"],
        "sinif_olasiliklari": olasiliklar,
        "tespit_edilen_riskli_ifadeler": riskli_ifadeler,
        "uyari": "Bu sistem klinik karar destek amaçlı bir proje prototipidir. Kesin tıbbi karar yerine geçmez."
    }