@echo off
REM Test script - Örnek klasör yapısı oluşturur ve aracı test eder

echo 🧪 Test klasörü oluşturuluyor...

REM Klasörleri oluştur
mkdir "test-media\ürünler\01 - KANEPELER\01 - 0203 - SU" 2>nul
mkdir "test-media\ürünler\01 - KANEPELER\16 - 0175 - RICH" 2>nul
mkdir "test-media\ürünler\01 - KANEPELER\BRISTOL" 2>nul
mkdir "test-media\ürünler\08 - RAF SİSTEMLERİ\MODERN" 2>nul
mkdir "test-media\ürünler\08 - RAF SİSTEMLERİ\KLASIK" 2>nul
mkdir "test-media\ürünler\03 - SANDALYELER\05 - COMFORT" 2>nul
mkdir "test-media\tasarımcılar\Ahmet Yılmaz" 2>nul
mkdir "test-media\tasarımcılar\Ayşe Demir" 2>nul
mkdir "test-media\tasarımcılar\Mehmet Kaya" 2>nul

REM Dummy görseller oluştur (boş dosyalar)
echo. > "test-media\ürünler\01 - KANEPELER\01 - 0203 - SU\su_kapak.jpg"
echo. > "test-media\ürünler\01 - KANEPELER\01 - 0203 - SU\su_kapak_mobil.jpg"
echo. > "test-media\ürünler\01 - KANEPELER\01 - 0203 - SU\su_1.jpg"
echo. > "test-media\ürünler\01 - KANEPELER\16 - 0175 - RICH\rich_kapak.jpg"
echo. > "test-media\ürünler\01 - KANEPELER\BRISTOL\bristol_kapak.jpg"
echo. > "test-media\ürünler\08 - RAF SİSTEMLERİ\MODERN\modern_kapak.jpg"
echo. > "test-media\ürünler\08 - RAF SİSTEMLERİ\KLASIK\klasik_kapak.png"
echo. > "test-media\ürünler\03 - SANDALYELER\05 - COMFORT\comfort_kapak.jpg"
echo. > "test-media\tasarımcılar\Ahmet Yılmaz\ahmet.jpg"
echo. > "test-media\tasarımcılar\Ahmet Yılmaz\ahmet_mobil.jpg"
echo. > "test-media\tasarımcılar\Ayşe Demir\ayse.jpg"
echo. > "test-media\tasarımcılar\Mehmet Kaya\mehmet.png"

echo ✅ Test klasörü oluşturuldu!
echo.
echo 📝 Not: test-media\ klasörüne gerçek görseller ekleyerek test edebilirsiniz.
echo.
echo 🚀 Aracı test etmek için:
echo    npm run import -- --source ./test-media --mode json --output ./test-output
echo.
pause

