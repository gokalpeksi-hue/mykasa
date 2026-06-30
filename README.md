# MyKasa 💚

Tarih bazlı **gelir / gider** ve **bakiye** takibi yapan mobil-öncelikli PWA.

- En üstte **aylık gelir, aylık gider ve kalan**; altında tarih bazlı **para giriş/çıkış** listesi.
- **Gelir**: tarih, kaynak, tutar, tür (Maaş, Havale/EFT, Nakit, Kira, Yatırım, Diğer).
- **Gider**: tarih, tip (Havale, Bakkaliye, Cafe, Restaurant, Manav, Diğer), tutar.
- 📷 **Fotoğraf / fiş / ekran görüntüsü** çekerek veya galeriden yükleyerek kayıt: yapay zeka fişten tarih + tutar + türü otomatik okur (Claude vision), sen onaylarsın. Fiş görseli kayda eklenir.
- ⬇️ **Yedekle / Geri Yükle**: tüm kayıtlar + fişler tek JSON dosyası (Google Drive'a yükleyip geri yükleyebilirsin).
- Tamamen cihazda çalışır (`localStorage` + `IndexedDB`), çevrimdışı destekli, kurulabilir uygulama (Add to Home Screen).

## Yayın
GitHub Pages: https://gokalpeksi-hue.github.io/mykasa/

## Geliştirme
Statik site — herhangi bir HTTP sunucusuyla açılır:

```bash
python -m http.server 5601
```

İkonlar saf Node ile üretilir:

```bash
node make-icons.js
```

Fiş okuma backend'i: `https://urun-fiyat-takip.onrender.com/api/vision-receipt` (Claude vision).
