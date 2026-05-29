import os
import pandas as pd


DATA_DIR = "data"


def csv_dosyasini_bul(data_dir):
    for dosya_adi in os.listdir(data_dir):
        if dosya_adi.endswith(".csv"):
            return os.path.join(data_dir, dosya_adi)

    raise FileNotFoundError("data klasöründe CSV dosyası bulunamadı.")


def main():
    csv_path = csv_dosyasini_bul(DATA_DIR)

    print("Bulunan veri seti:")
    print(csv_path)

    df = pd.read_csv(csv_path, sep=";", encoding="windows-1254")

    print("\nVeri boyutu:")
    print(df.shape)

    print("\nSütun adları:")
    for col in df.columns:
        print("-", col)

    print("\nİlk 5 satır:")
    print(df.head())

    print("\nEksik değer sayıları:")
    print(df.isnull().sum())

    print("\nVeri tipleri:")
    print(df.dtypes)


if __name__ == "__main__":
    main()