#!/bin/bash

# Test script - Örnek klasör yapısı oluşturur ve aracı test eder

echo "🧪 Test klasörü oluşturuluyor..."

# Klasörleri oluştur
mkdir -p "test-media/ürünler/01 - KANEPELER/01 - 0203 - SU"
mkdir -p "test-media/ürünler/01 - KANEPELER/16 - 0175 - RICH"
mkdir -p "test-media/ürünler/01 - KANEPELER/BRISTOL"
mkdir -p "test-media/ürünler/08 - RAF SİSTEMLERİ/MODERN"
mkdir -p "test-media/ürünler/08 - RAF SİSTEMLERİ/KLASIK"
mkdir -p "test-media/ürünler/03 - SANDALYELER/05 - COMFORT"
mkdir -p "test-media/tasarımcılar/Ahmet Yılmaz"
mkdir -p "test-media/tasarımcılar/Ayşe Demir"
mkdir -p "test-media/tasarımcılar/Mehmet Kaya"

# Dummy görseller oluştur (1x1 pixel PNG)
# Not: Gerçek test için gerçek görseller kullanın
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > test-media/ürünler/"01 - KANEPELER"/"01 - 0203 - SU"/su_kapak.jpg
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > test-media/ürünler/"01 - KANEPELER"/"01 - 0203 - SU"/su_kapak_mobil.jpg
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > test-media/ürünler/"01 - KANEPELER"/"01 - 0203 - SU"/su_1.jpg
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > test-media/ürünler/"01 - KANEPELER"/"16 - 0175 - RICH"/rich_kapak.jpg
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > test-media/ürünler/"01 - KANEPELER"/BRISTOL/bristol_kapak.jpg
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > test-media/tasarımcılar/"Ahmet Yılmaz"/ahmet.jpg
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > test-media/tasarımcılar/"Ahmet Yılmaz"/ahmet_mobil.jpg
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > test-media/tasarımcılar/"Ayşe Demir"/ayse.jpg

echo "✅ Test klasörü oluşturuldu!"
echo ""
echo "📝 Not: test-media/ klasörüne gerçek görseller ekleyerek test edebilirsiniz."
echo ""
echo "🚀 Aracı test etmek için:"
echo "   npm run import -- --source ./test-media --mode json --output ./test-output"

