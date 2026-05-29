import joblib
import pandas as pd


MODEL_PATH = "models/triage_model.joblib"


def main():
    kayit_paketi = joblib.load(MODEL_PATH)

    model = kayit_paketi["model"]
    ozellikler = kayit_paketi["ozellikler"]

    ornek_hasta = {}

    for ozellik in ozellikler:
        ornek_hasta[ozellik] = None

    ornek_hasta["text"] = "chest pain and shortness of breath"

    if "age" in ozellikler:
        ornek_hasta["age"] = 58

    if "nrs_pain" in ozellikler:
        ornek_hasta["nrs_pain"] = 9

    if "sbp" in ozellikler:
        ornek_hasta["sbp"] = 90

    if "dbp" in ozellikler:
        ornek_hasta["dbp"] = 60

    if "hr" in ozellikler:
        ornek_hasta["hr"] = 125

    if "rr" in ozellikler:
        ornek_hasta["rr"] = 28

    if "bt" in ozellikler:
        ornek_hasta["bt"] = 37.2

    if "saturation" in ozellikler:
        ornek_hasta["saturation"] = 88

    if "sex" in ozellikler:
        ornek_hasta["sex"] = "2"

    if "injury" in ozellikler:
        ornek_hasta["injury"] = "1"

    if "mental" in ozellikler:
        ornek_hasta["mental"] = "1"

    if "pain" in ozellikler:
        ornek_hasta["pain"] = "1"

    ornek_df = pd.DataFrame([ornek_hasta])

    tahmin = model.predict(ornek_df)[0]
    olasiliklar = model.predict_proba(ornek_df)[0]
    siniflar = model.classes_

    print("Hasta şikayeti:")
    print(ornek_hasta["text"])

    print("\nTahmin edilen triaj sınıfı:")
    print(tahmin)

    print("\nSınıf olasılıkları:")
    for sinif, olasilik in zip(siniflar, olasiliklar):
        print(f"{sinif}: {olasilik:.3f}")


if __name__ == "__main__":
    main()