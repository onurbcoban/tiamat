# Tiamat — Mimari Özeti

---

## Büyük Resim

Tiamat, tarayıcıda çalışan, Three.js tabanlı bir birinci şahıs kaçış odası oyunudur.
Harici bir oyun motoru yoktur; render döngüsü, fizik, etkileşim ve UI katmanı
doğrudan JS ile kurulmuştur.

```
┌─────────────────────────────────────────────┐
│                  main.js                    │  ← Tek giriş noktası
│   Sahneyi kurar, modülleri bağlar,          │
│   render döngüsünü çalıştırır              │
└──────┬──────────┬──────────┬───────────────┘
       │          │          │
  [world]     [player]   [puzzles]
       │          │          │
       └──────────┴──────────┘
                  │
            core/state.js     ← Merkezi veri deposu
                  │
               [ui]           ← Sadece state'i okur, DOM günceller
```

---

## Modüller ve Sorumlulukları

### `core/state.js`
Oyunun tek gerçek veri deposu. Hiçbir modül birbirinden import etmez;
iletişim `state` üzerinden olur.

```
state = {
  // Oyuncu durumu
  sanity        → 0-100, her karede azalır
  oxygen        → 0-100, su altında azalır
  drowningTime  → 4 saniye dolunca ölüm
  isDead        → ölüm bayrağı
  isSwimming    → camera.y < -0.5 ise true
  waterDrained  → valf puzzle çözüldüğünde true
  heldItem      → 'captain_key' | 'pressure_valve_wheel' | 'generator_coil' | null
  magnesiumCount → toplanmış tablet sayısı
  flickerActive → jeneratör aktive edilince true

  // Puzzle durumu
  puzzles: { valve, pressure, simon }  → boolean
  powerRestored   → breaker puzzle çözülünce true
  doorOpen        → tüm puzzle'lar çözülünce true

  // main.js tarafından runtime'da eklenen referanslar
  scene, camera, hud, interactables

  // Callback
  onPuzzleSolved(name) → main.js tarafından atanır, HUD'u günceller
  dropHeldItem()       → objects.js tarafından atanır
}
```

**Önemli:** `scene`, `camera`, `hud` state'e `main.js`'de sonradan atanır
(satır 72-75). `state.js` bu bağımlılıkları import etmez; döngüsel import'u
önlemek için bu pattern seçildi.

---

### `main.js` — Orkestratör

Hiçbir oyun mantığı içermez. Tek sorumluluğu:

1. Renderer, sahne, kamera, composer'ı kurar
2. Tüm modülleri `create*()` ile başlatır ve döndürdükleri `update` fonksiyonlarını saklar
3. `animate()` döngüsünde hepsini sırasıyla çağırır
4. Global olayları yönetir: sanity azalması, boğulma ölümü, kapı açılışı, kamera sallantısı

**Başlatma sırası önemlidir:**
```
createRoom → createLights → createHUD →
state.scene/camera/hud ataması →
createDoor → createValvePuzzle → createPressurePuzzle →
createSimonPuzzle → createMovement → createInteraction →
createBreakerPuzzle → createGeneratorPuzzle → createObjects →
createOverlay
```
`createObjects` en sona gelir çünkü partikül sistemi için
`state.camera`'nın atanmış olması gerekir.

---

### `world/room.js` — Statik Geometri

Oyunun fiziksel ortamını inşa eder. Çalışması bittikten sonra güncellenmez.

- 7 oda: Kaptan Kabini, Yemekhane, Koridor, Mürettebat Koğuşu,
  Su Basman Oda, Jeneratör Odası, Köprü
- Her oda `wallN/S/E/W`, `addFloor`, `addCeiling` yardımcı
  fonksiyonlarıyla düzgün bir DSL gibi kurulur
- `doorWall*` fonksiyonları geçiş boşluklarını açar + çerçeve ekler
- `addWallDetails()` her duvara 3D panel dikişi ve perçin ekler
- `buildMadRoomDoor()` + `buildVisualChain()`: karantina kapısı ve
  Quaternion tabanlı zincir sistemi

---

### `world/lights.js` — Işık ve Gölge

İki katmanlı ışık sistemi:

```
Acil Durum Katmanı (her zaman var, güç kesilince görünür)
  12 × PointLight(kırmızı) + görsel ampul mesh

Ana Aydınlatma Katmanı (güç geri gelince aktif)
  12 × SpotLight(beyaz) + soket + ampul
  updateRoomLights() → oyuncuya mesafeye göre yoğunluk
```

Flashlight doğrudan `camera`'ya eklenir; sahne koordinatlarıyla
değil kamera koordinatlarıyla hareket eder.

Flashlight'ın `intensity` ve `visible` property'leri
`Object.defineProperty` ile override edilmiştir çünkü her değişimde
`spillLight` ve `coneMat` uniform'larının da güncellenmesi gerekir.

---

### `world/textures.js` — Prosedürel Doku Fabrikası

Hiçbir dış görüntü dosyası yoktur. Tüm dokular:
```
HTML5 Canvas  →  ctx çizimleri  →  THREE.CanvasTexture
```

Normal haritalar da prosedürel üretilir: Canvas piksel verisi
Sobel türevi ile normal vektöre dönüştürülür (`createNormalMap()`).

Diğer modüller bu dosyadan ihtiyaçlarını import eder. Singleton
değil: her çağrıda yeni texture nesnesi döner.

---

### `world/objects.js` — Dinamik Nesne Yöneticisi

En büyük dosya (1700+ satır). Birden fazla sorumluluğu var:

- Mobilya, kapılar, dolaplar, puzzle nesneleri → geometri + materyal
- Kaptan anahtarı, jeneratör bobini, magnezyum tabletleri → toplanabilir item'lar
- **Partikül sistemi** → su altı mikro baloncukları (Three.Points)
- **Su yüzeyi animasyonu** → `normalMap.offset` UV kaydırması + su boşaltma
- **Pump rotor** dönüşü, köprü ekranı güncelleme
- İç döngü `update(delta)` → tüm animasyonlar burada

---

### `player/movement.js` — Fizik ve Kontrol

FPS hareketi manuel olarak uygulanmıştır (fizik motoru yok):

```
Her kare:
  1. Flashlight yoğunluğu (Q/E tuşları + sanity flicker)
  2. isSwimming tespiti (camera.y < -0.5)
  3. Oksijen / boğulma sayacı
  4. Sanity drain (karanlık + oksijen + karantina kapısına yakınlık)
  5. WASD → Vector3 hareket hesabı
  6. Çarpışma kontrolü (Box3 AABB, eksen bazlı ayrı ayrı)
  7. Yerçekimi / zıplama / merdiven / yüzme dalı seçimi
  8. Su altında: sin(time) kaldırma kuvveti salınımı
```

**Çarpışma mimarisi:** Tüm solid geometriler `collidableBoxes[]` array'ine
`THREE.Box3` olarak eklenir. Movement her kare bu array'e karşı
oyuncu AABB'sini test eder.

---

### `player/interaction.js` — Etkileşim Sistemi

Her kare ekranın tam ortasından (0,0) bir `Raycaster` atar.
Çarpan mesh, `interactables[]` array'inde aranır.

**Interactable nesnesi formatı:**
```js
{
  mesh,           // raycast hedefi
  highlightMesh,  // (opsiyonel) emissive highlight uygulanacak mesh
  name,           // HUD'da gösterilecek isim
  prompt,         // "F: ..." ipucu metni
  onInteract(),   // F tuşu
  onClick()       // sol tık (opsiyonel)
}
```

`interactables[]` array'i runtime'da değişir: item toplandığında
veya koşul sağlanmadığında splice ile kaldırılır.

---

### `puzzles/*` — Puzzle Modülleri

Her puzzle aynı pattern'i izler:

```js
export function createXxxPuzzle(scene, interactables, collidableBoxes, hud) {
  // 1. Sahneye geometri ekle
  // 2. interactables'a etkileşim nesnesi ekle
  // 3. state'i dinle / güncelle
  // 4. update(delta) fonksiyonu döndür
}
```

Puzzle'lar birbirleriyle doğrudan konuşmaz; `state` üzerinden
bayrak değiştirir (örneğin `state.puzzles.valve = true`).

**Puzzle bağımlılık zinciri (oynanış sırası):**
```
pressure puzzle (manometre 6 bar)
    ↓
valve puzzle (vanaları hizala + dren kolu)
    ↓  state.waterDrained = true
breaker puzzle (sigorta kutusu + coil)
    ↓  state.powerRestored = true
simon puzzle (renk sekansı)
    ↓  state.puzzles.simon = true
        → state.allSolved = true
            → door.open()
```

---

### `ui/hud.js` + `ui/overlay.js` — Arayüz

WebGL katmanıyla ilgisi yoktur; tamamen DOM tabanlıdır.

- `hud.js` → sanity/oksijen çubukları, nesne adı, ipucu, hedefler paneli
- `overlay.js` → başlangıç ekranı, ölüm ekranı, kazanma ekranı

`state`'i import eder ama yazmaz; sadece okur. Güncelleme
`hud.updateStats(state)` çağrısıyla main.js tarafından tetiklenir.

---

## Render Döngüsü

```
animate() her kare:
│
├─ movement.update(delta)       ← fizik, flashlight, oksijen, sanity
│
├─ interaction.update(hud)      ← raycast, highlight, ipucu
│
├─ state.sanity -= 0.25*delta   ← pasif sanity azalması
│
├─ puzzle.update(delta) × 6     ← valve, pressure, simon, door,
│                                   breaker, generator
│
├─ objects.update(delta)        ← baloncuklar, su, animasyonlar
│
├─ hud.updateStats(state)       ← DOM güncelle
│
├─ lights.updateRoomLights()    ← oda ışıkları LOD
│
├─ [sanity=0 → ölüm kontrolü]
├─ [boğulma → ölüm kontrolü]
├─ [madRoom slam → sanity drop]
├─ [kamera sallantısı offset]
│
└─ composer.render()            ← WebGL çiz
   └─ RenderPass → UnrealBloom → OutputPass
```

---

## Veri Akışı Özeti

```
Klavye/Mouse
    ↓
movement.js / interaction.js
    ↓ state'e yazar
state.js  ←──────────────── puzzle'lar da yazar
    ↑
main.js okur (sanity, drowning, allSolved)
    ↓
hud.js okur → DOM günceller
lights.js okur (powerRestored, isSwimming)
objects.js okur (isSwimming, powerRestored, waterDrained)
```

**Kural:** Modüller arası doğrudan fonksiyon çağrısı sadece
`main.js` orkestrasyonuyla gerçekleşir (init zamanında argüman olarak geçirilir).
Runtime'da haberleşme `state` üzerinden olur.

---

## Dosya Yapısı

```
src/
├── main.js                 ← giriş, orkestratör
├── style.css               ← HUD ve overlay stilleri
│
├── core/
│   └── state.js            ← merkezi veri deposu
│
├── world/
│   ├── room.js             ← statik sahne geometrisi
│   ├── lights.js           ← ışık sistemi + GLSL shader
│   ├── objects.js          ← mobilya, item'lar, partikül, animasyon
│   └── textures.js         ← prosedürel doku fabrikası
│
├── player/
│   ├── movement.js         ← fizik, kontrol, kamera
│   └── interaction.js      ← raycast, etkileşim, highlight
│
├── puzzles/
│   ├── valve.js            ← vana + dren kolu puzzle'ı
│   ├── pressure.js         ← manometre kalibrasyonu
│   ├── simon.js            ← renk sekansı
│   ├── breaker.js          ← sigorta kutusu + bobin
│   ├── generator.js        ← jeneratör + güç flicker
│   └── door.js             ← ana çıkış kapısı
│
└── ui/
    ├── hud.js              ← oyun içi arayüz (DOM)
    └── overlay.js          ← menü / ölüm / kazanma ekranı
