

import os
import re
import joblib
import json
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


DATA_DIR = "data"
MODEL_PATH = "models/triage_model.joblib"
RESULTS_DIR = "results"


def csv_dosyasini_bul(data_dir):
    for dosya_adi in os.listdir(data_dir):
        if dosya_adi.endswith(".csv"):
            return os.path.join(data_dir, dosya_adi)

    raise FileNotFoundError("data klasöründe CSV dosyası bulunamadı.")


def sutun_adlarini_duzenle(df):
    df = df.copy()

    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
        .str.replace("-", "_")
    )

    return df


def sutun_bul(df, olasi_adlar):
    for ad in olasi_adlar:
        duzenlenmis_ad = (
            ad.strip()
            .lower()
            .replace(" ", "_")
            .replace("-", "_")
        )

        if duzenlenmis_ad in df.columns:
            return duzenlenmis_ad

    return None


def metni_temizle(deger):
    if pd.isna(deger):
        return ""

    deger = str(deger).lower()
    deger = re.sub(r"[^a-zA-Z0-9\s]", " ", deger)
    deger = re.sub(r"\s+", " ", deger).strip()

    return deger


def ktas_sinifa_cevir(deger):
    """
    KTAS:
    1 = en acil
    5 = en az acil

    Bizim sınıflar:
    1-2 -> red
    3   -> yellow
    4-5 -> green
    """

    try:
        deger = int(float(deger))
    except:
        return np.nan

    if deger in [1, 2]:
        return "red"
    elif deger == 3:
        return "yellow"
    elif deger in [4, 5]:
        return "green"
    else:
        return np.nan


def main():
    os.makedirs("models", exist_ok=True)

    csv_path = csv_dosyasini_bul(DATA_DIR)
    print(f"Veri seti okunuyor: {csv_path}")

    df = pd.read_csv(csv_path, sep=";", encoding="windows-1254")
    df = sutun_adlarini_duzenle(df)

    print("\nVeri setindeki sütunlar:")
    print(df.columns.tolist())

    sikayet_sutunu = sutun_bul(df, [
        "chief_complain",
        "chief_complaint",
        "chiefcomplaint",
        "complaint"
    ])

    hedef_sutun = sutun_bul(df, [
        "ktas_expert",
        "ktas_rn",
        "ktas",
        "triage"
    ])

    if sikayet_sutunu is None:
        raise ValueError("Hasta şikayeti sütunu bulunamadı.")

    if hedef_sutun is None:
        raise ValueError("KTAS / triaj hedef sütunu bulunamadı.")

    print(f"\nKullanılan şikayet sütunu: {sikayet_sutunu}")
    print(f"Kullanılan hedef sütun: {hedef_sutun}")

    df["text"] = df[sikayet_sutunu].apply(metni_temizle)
    df["triage_class"] = df[hedef_sutun].apply(ktas_sinifa_cevir)

    df = df.dropna(subset=["triage_class"])
    df = df[df["text"].str.len() > 0]

    sayisal_adaylar = [
        "age",
        "patients_number_per_hour",
        "nrs_pain",
        "sbp",
        "dbp",
        "hr",
        "rr",
        "bt",
        "saturation",
        "length_of_stay_min",
        "ktas_duration_min"
    ]

    kategorik_adaylar = [
        "group",
        "sex",
        "arrival_mode",
        "injury",
        "mental",
        "pain"
    ]

    sayisal_ozellikler = [col for col in sayisal_adaylar if col in df.columns]
    kategorik_ozellikler = [col for col in kategorik_adaylar if col in df.columns]

    for col in sayisal_ozellikler:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    sayisal_ozellikler = [
        col for col in sayisal_ozellikler
        if df[col].notna().sum() > 0
    ]

    for col in kategorik_ozellikler:
        df[col] = df[col].astype(str)

    ozellikler = ["text"] + sayisal_ozellikler + kategorik_ozellikler

    X = df[ozellikler]
    y = df["triage_class"]

    print("\nTemizlenmiş veri boyutu:")
    print(df.shape)

    print("\nKullanılan özellikler:")
    print(ozellikler)

    print("\nSınıf dağılımı:")
    print(y.value_counts())

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y
    )

    metin_donusturucu = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        min_df=2,
        max_features=10000
    )

    sayisal_donusturucu = Pipeline(
        steps=[
            ("eksik_deger_doldurma", SimpleImputer(strategy="median")),
            ("olcekleme", StandardScaler())
        ]
    )

    kategorik_donusturucu = Pipeline(
        steps=[
            ("eksik_deger_doldurma", SimpleImputer(strategy="most_frequent")),
            ("one_hot_encoder", OneHotEncoder(handle_unknown="ignore"))
        ]
    )

    donusturuculer = [
        ("metin", metin_donusturucu, "text")
    ]

    if sayisal_ozellikler:
        donusturuculer.append(("sayisal", sayisal_donusturucu, sayisal_ozellikler))

    if kategorik_ozellikler:
        donusturuculer.append(("kategorik", kategorik_donusturucu, kategorik_ozellikler))

    on_isleme = ColumnTransformer(transformers=donusturuculer)

    model = Pipeline(
        steps=[
            ("on_isleme", on_isleme),
            ("siniflandirici", LogisticRegression(
                max_iter=2000,
                class_weight="balanced"
            ))
        ]
    )

    print("\nModel eğitiliyor...")
    model.fit(X_train, y_train)

    print("\nModel test ediliyor...")
    y_pred = model.predict(X_test)

    os.makedirs(RESULTS_DIR, exist_ok=True)

    accuracy = accuracy_score(y_test, y_pred)

    labels = ["red", "yellow", "green"]

    report_dict = classification_report(
        y_test,
    y_pred,
    labels=labels,
    output_dict=True,
    zero_division=0
)

    report_text = classification_report(
    y_test,
    y_pred,
    labels=labels,
    zero_division=0
)

    cm = confusion_matrix(y_test, y_pred, labels=labels)

    print("\nAccuracy:")
    print(accuracy)

    print("\nClassification Report:")
    print(report_text)

    print("\nConfusion Matrix:")
    print(labels)
    print(cm)

    # Classification report CSV olarak kaydediliyor
    report_df = pd.DataFrame(report_dict).transpose()
    report_df.to_csv(
        os.path.join(RESULTS_DIR, "classification_report.csv"),
        index=True,
        encoding="utf-8-sig"
)

# Confusion matrix CSV olarak kaydediliyor
    cm_df = pd.DataFrame(
    cm,
    index=[f"Gerçek_{label}" for label in labels],
    columns=[f"Tahmin_{label}" for label in labels]
)

    cm_df.to_csv(
    os.path.join(RESULTS_DIR, "confusion_matrix.csv"),
    encoding="utf-8-sig"
)

# Sınıf dağılımı kaydediliyor
    class_distribution = y.value_counts().reset_index()
    class_distribution.columns = ["triage_class", "count"]

    class_distribution.to_csv(
    os.path.join(RESULTS_DIR, "class_distribution.csv"),
    index=False,
    encoding="utf-8-sig"
)

# Rapor için okunabilir özet dosyası oluşturuluyor
    summary_path = os.path.join(RESULTS_DIR, "metrics_summary.txt")

    with open(summary_path, "w", encoding="utf-8") as f:
        f.write("NLP Tabanlı Otomatik Triaj Modeli - Deney Sonuçları\n")
        f.write("=" * 60)
        f.write("\n\n")

        f.write(f"Kullanılan model: TF-IDF + Logistic Regression\n")
        f.write(f"Kullanılan hedef sütun: {hedef_sutun}\n")
        f.write(f"Kullanılan şikayet sütunu: {sikayet_sutunu}\n")
        f.write(f"Toplam temizlenmiş veri sayısı: {len(df)}\n")
        f.write(f"Eğitim veri sayısı: {len(X_train)}\n")
        f.write(f"Test veri sayısı: {len(X_test)}\n")
        f.write(f"Accuracy: {accuracy:.4f}\n\n")

        f.write("Kullanılan Özellikler:\n")
        for ozellik in ozellikler:
            f.write(f"- {ozellik}\n")

        f.write("\nSınıf Dağılımı:\n")
        f.write(str(y.value_counts()))
        f.write("\n\n")

        f.write("Classification Report:\n")
        f.write(report_text)
        f.write("\n\n")

        f.write("Confusion Matrix:\n")
        f.write(str(labels))
        f.write("\n")
        f.write(str(cm))
        f.write("\n\n")

        f.write("Sınıf Açıklamaları:\n")
        f.write("red: Kırmızı / Çok acil\n")
        f.write("yellow: Sarı / Orta acil\n")
        f.write("green: Yeşil / Daha az acil\n")

    print(f"\nSonuç dosyaları kaydedildi: {RESULTS_DIR}")

    kayit_paketi = {
        "model": model,
        "ozellikler": ozellikler,
        "sayisal_ozellikler": sayisal_ozellikler,
        "kategorik_ozellikler": kategorik_ozellikler,
        "sikayet_sutunu": sikayet_sutunu,
        "hedef_sutun": hedef_sutun
    }

    joblib.dump(kayit_paketi, MODEL_PATH)

    print(f"\nModel kaydedildi: {MODEL_PATH}")


if __name__ == "__main__":
    main()