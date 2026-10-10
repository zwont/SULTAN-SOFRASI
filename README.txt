SULTAN SOFRASI - FINAL

1) Python 3 kurulu olmalı.
2) Bu klasörde terminal aç:
   python server.py
3) PC'de: http://localhost:8000
4) Admin: http://localhost:8000/admin.html?admin=1
5) Telefonu aynı Wi-Fi'ye bağla. PC'nin yerel IP'siyle aç:
   http://PC-IP:8000

Siparişler orders.json dosyasına kaydedilir ve admin paneli 3 saniyede bir yeni siparişleri çeker.
Gerçek internetten herkese açmak için bu klasör bir sunucuda çalıştırılmalıdır.


KOD YAPISI:
- index.html + index.js + style.css
- admin.html + admin.js + style.css
- server.py sipariş API

MÜŞTERİ AKTİF SİPARİŞLERİ:
- Sipariş başarıyla gönderilince müşteri sayfasında, sepetin hemen altında görünür.
- "Gördüm" düğmesi admin panelindeki gibi "Görüldü" durumuna geçer.
- Müşteri sayfasından ayrılınca bu görünüm temizlenir; sunucuya kaydedilen sipariş admin panelinde kalmaya devam eder.
