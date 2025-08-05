🗺️ Başarsoft Staj Harita Uygulaması

Bu proje, React (OpenLayers) ile geliştirilmiş interaktif bir harita uygulamasıdır. Kullanıcı, Nokta, Çizgi ve Alan (Polygon) geometrilerini harita üzerinden çizebilir, güncelleyebilir, silebilir veya sunucudan veri çekebilir.

Backend kısmı ASP.NET Core Web API + PostGIS altyapısı ile yazılmıştır.


📦 Proje Yapısı

başarsoft-staj/

├── frontend/          → React + OpenLayers tabanlı harita arayüzü

└── WebApplication2/   → ASP.NET Core Web API (Backend)


🔧 Özellikler

🎨 Harita İşlevleri (Frontend):
- Nokta, Çizgi ve Alan (Poligon) çizimi
- A, B, C tipi geometri desteği (farklı snapping kuralları)
- Geometri listesi, sayfalama
- ID ile arama, güncelleme ve silme
- Akıllı snap (çekim) noktaları
- Poligon kesişim kontrolü
- Nokta sayısını poligon içinde hesaplama
- Harita üzerinde geometri seçimi ve düzenleme
- Arama kutusu ile isme göre filtreleme (0.6 saniye gecikmeli)
- Tüm geometri türlerini yükleme ve API testleri

💻 Backend (ASP.NET Core + PostGIS):
- /api/Point, /api/Line, /api/Polygon endpointleri
- CRUD işlemleri
- DTO yapıları ile veri transferi
- WKT formatı ile geometri gönderimi
- PostGIS üzerinden poligon kesişim kontrolü (/Polygon/check-intersection)
- NetTopologySuite desteği
- `Response<T>` yapısı ile API yanıtları


🚀 Kurulum

1. Backend (ASP.NET Core):

WebApplication2 klasörüne gir:

- PostgreSQL + PostGIS kurulu olmalı
- appsettings.json içindeki bağlantı dizesi (connection string) güncel olmalı
- Gerekli NuGet paketleri:
  - NetTopologySuite
  - Microsoft.EntityFrameworkCore
  - Npgsql.EntityFrameworkCore.PostgreSQL.NetTopologySuite

Komut satırında:

  dotnet restore
  dotnet build
  dotnet run

Uygulama şu adreste çalışır:
https://localhost:7215


2. Frontend (React):

frontend klasörüne gir:

  npm install
  npm start

Uygulama şu adreste çalışır:
http://localhost:3000

NOT: Backend çalışır durumda olmalıdır. API_BASE: https://localhost:7215


🎯 Geometri Tipleri

| Tip | Açıklama                  | Snap Davranışı                        |
|-----|---------------------------|---------------------------------------|
| A   | Varsayılan tip            | Tüm noktalara snap aktif              |
| B   | İkincil tip               | Sadece A tipi noktalara snap          |
| C   | Üçüncül tip               | Sadece B tipi noktalara snap          |


🧪 API Test

- “🔍 API Test” butonu ile tüm API uç noktalarına (endpoint) istek atılır.
- Konsolda başarılı/başarısız istekler gösterilir.


📸 Ekran Görüntüsü

Ekran görüntüsü eklemek istersen:
- README dosyası ile aynı klasöre “ekran-goruntusu.png” koy
- GitHub üzerinde otomatik görüntülenir


🧑‍💻 Geliştirici

Bu proje, Başarsoft Yaz Stajı kapsamında ben yani **Sema Gül Çelik** tarafından backend ve frontend olarak geliştirilmiştir.



