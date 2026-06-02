# Tiamat — Three.js / WebGL Teknoloji Envanteri

> Projedeki her Three.js / WebGL özelliğinin ne olduğu ve **nerede kullanıldığı** — kaynak dosyasıyla birlikte.
> Son doğrulama: tüm 12 kaynak dosyası satır satır kontrol edildi.

---

## 📦 Temel Altyapı

| Teknoloji | Kullanım Yeri | Açıklama |
|-----------|--------------|----------|
| `THREE.WebGLRenderer` | `src/main.js:27` | Tüm sahneyi WebGL ile render eder |
| `renderer.antialias = true` | `src/main.js:27` | Piksel kıyısı yumuşatma |
| `renderer.setPixelRatio(min(dpr, 1.5))` | `src/main.js:29` | Yüksek DPI ekranlarda performans dengesi |
| `renderer.shadowMap.enabled = true` | `src/main.js:30` | Global gölge haritası aktivasyonu |
| `renderer.shadowMap.type = PCFSoftShadowMap` | `src/main.js:31` | Yumuşak kenarlı gölge algoritması |
| `renderer.toneMapping = ACESFilmicToneMapping` | `src/main.js:32` | Hollywood HDR→LDR dönüşümü; sinematik kontrast |
| `renderer.toneMappingExposure = 1.30` | `src/main.js:33` | Fener ışığının patlamaması için maruz kalma ayarı |
| `renderer.outputColorSpace = SRGBColorSpace` | `src/main.js:34` | Doğru renk uzayı çıktısı |
| `THREE.Scene` | `src/main.js:37` | Ana sahne grafiği |
| `THREE.PerspectiveCamera` | `src/main.js:40` | FoV 75°, near 0.1, far 100 |
| `THREE.Clock` | `src/main.js:125` | `delta` tabanlı frame-rate bağımsız güncelleme |

---

## 🌫 Sis (Fog)

| Teknoloji | Kullanım Yeri | Açıklama |
|-----------|--------------|----------|
| `THREE.FogExp2(0x030810, 0.042)` | `src/main.js:38` | Üstel sis; derin deniz karanlığı ve atmosfer derinliği |

---

## 🎬 Post-Processing (EffectComposer)

| Pass | Kullanım Yeri | Parametreler | Etki |
|------|--------------|-------------|------|
| `RenderPass` | `src/main.js:50` | scene, camera | Ham sahne render |
| `UnrealBloomPass` | `src/main.js:54-60` | strength 0.08, radius 0.55, threshold 0.99 | Acil durum ışıklarının ve fener ışığının hafif halesi |
| `OutputPass` | `src/main.js:62` | — | Tone mapping + renk uzayı uygulama (pipeline sonu) |

---

## 💡 Işıklar (Lights)

### `src/world/lights.js`

| Işık | Tür | Detay |
|------|-----|-------|
| `ambient` | `THREE.AmbientLight` | Renk `0x7a8fa5`, yoğunluk 1.1 — tüm sahneye soğuk çelik mavi |
| `hemi` | `THREE.HemisphereLight` | Sky `0x6a8fa5` / Ground `0x1a222a`, yoğunluk 0.7 — denizaltı zemin/tavan renk ayrımı |
| `dir` | `THREE.DirectionalLight` | Renk `0x2a3e50`, yoğunluk 0.0 (kapalı) — rezerv |
| `emergencyGroup` ×12 | `THREE.PointLight` | Renk `0xff2222`, yoğunluk 0.55, mesafe 4.2 — kırmızı acil durum ışıkları |
| `mainLightsGroup` ×12 | `THREE.SpotLight` | Renk `0xe8f4ff`, açı PI/1.5, penumbra 1.0, mesafe 5-8.5 — güç geri gelince aktif olan beyaz tavan spotları |
| `flashlight` | `THREE.SpotLight` | Renk `0xd0e8ff`, açı PI/4.5, penumbra 0.5, decay 1.8, distance 40 — oyuncuya bağlı el feneri |
| `spillLight` | `THREE.SpotLight` | Flashlight'a eklenen geniş açılı (PI/2) dolgu ışığı |

**Gölge Haritası (sadece flashlight):**
- `mapSize` 2048×2048
- `camera.near` 0.5, `camera.far` 40
- `bias` -0.0003

**Dinamik LOD Işık Yönetimi (`updateRoomLights`):**
Oyuncunun kameraya uzaklığına göre ana SpotLight'ların yoğunluğunu `0.0 – 18.0` arasında interpolasyon yaparak günceller. 6m altında tam parlaklık, 12m üstünde tamamen söner. FPS korumak için `castShadow = false`.

---

## 🎨 Materyaller (Materials)

### MeshStandardMaterial (PBR) — Yaygın kullanım

| Materyal | Kullanım Yeri | Metalness / Roughness |
|----------|--------------|----------------------|
| `matFloor` | `src/world/room.js:18` | 0.60 / 0.70 — ıslak metal zemin |
| `matCeil` | `src/world/room.js:19` | 0.40 / 0.90 — koyu paslanmış tavan |
| `matWall*` (×7) | `src/world/room.js:20-26` | 0.45-0.55 / 0.65-0.85 — oda bazlı renk tonu |
| `socketMat` | `src/world/lights.js:134` | 0.8 / 0.4 — karanlık metal fener yuvası |
| `woodMat` | `src/world/objects.js:242` | 0.0 / 0.95 — ahşap masa üstü |
| `steelMat` | `src/world/objects.js:249` | 0.70 / 0.45 — çelik çerçeve |
| `lockerMat` | `src/world/objects.js:432` | 0.70 / 0.40 — metal dolap |
| `doorMat` | `src/puzzles/door.js:27` | 0.80 / 0.35 + PBR map'ler |
| `wheelMat` | `src/puzzles/door.js:84` | 0.70 / 0.30 + map |
| `metalMat` | `src/puzzles/breaker.js:14` | 0.70 / 0.50 — sigorta kutusu |
| `copperMat` | `src/puzzles/breaker.js:58` | 0.85 / 0.30 — bakır bobin |
| `brassMat` | `src/puzzles/pressure.js:91` | 0.75 / 0.30 + map — pirinç vana |
| `ledRed/ledGreen` | `src/puzzles/pressure.js:93-94` | emissive ile + 0.8 yoğunluk |
| `panelMat` | `src/puzzles/simon.js:38` | + `CanvasTexture` map |

**emissive kullanımı** (self-illumination / kendi ışığını yayan):
- Simon Says butonları: `emissive` renk + `emissiveIntensity 0.8–1.0`
- Kapı durum ışığı: kırmızı↔yeşil toggle
- Breaker coil indikatörü: turuncu darbe efekti
- Generator ring: aktive olunca yeşil parlar
- Valve leverleri: kırmızı/yeşil durum göstergesi

### MeshBasicMaterial (ışıksız)

| Kullanım | Dosya | Amaç |
|----------|-------|------|
| Emergency bulb mesh | `src/world/lights.js:81` | Kırmızı ampul görsel, ışıktan bağımsız |
| White main bulb | `src/world/lights.js:99` | Beyaz ampul görsel |
| Hit mesh (invisible) | `src/puzzles/breaker.js:49`, `valve.js:322`, `generator.js:22` | Şeffaf raycast hedef kutusu |
| Void mesh (siyah zemin) | `src/puzzles/door.js:159` | Kapı arkası boşluğun kapanması |
| Pressure valve hitbox | `src/puzzles/pressure.js:116,140,165` | Görünmez tıklama alanları |
| Generator coil hitbox | `src/world/objects.js:1668` | `visible: false` — toplanabilir coil tıklama alanı |

### bumpMap kullanımı

Projede `normalMap`'e ek olarak `bumpMap` de kullanılıyor (eski yöntem, üçüncü bir kabartma katmanı olarak):

| Nesne | Dosya | Detay |
|-------|-------|-------|
| Kapı (ana çıkış) | `src/puzzles/door.js:29` | `bumpMap: doorTex`, `bumpScale` ile hafif kabartma |
| Valf kapısı | `src/puzzles/valve.js:82` | `bumpMap: doorTex` — aynı CanvasTexture'ı hem `map` hem `bumpMap` olarak kullanır |
| Kabin kapısı | `src/world/objects.js:527` | `bumpMap: cabinDoorTex` + `normalMap` — ikisi birlikte |
| Jeneratör kasası | `src/world/objects.js:1062` | `bumpMap: genTex` |

### ShaderMaterial (özel GLSL)

| Kullanım | Dosya | Shader'lar |
|----------|-------|-----------|
| Flashlight volumetric cone | `src/world/lights.js:175-187` | `edgeFade` (dot product), `distanceFade` (UV.y pow), `nearFade` (smoothstep) + `AdditiveBlending` |

**Vertex Shader:** `modelViewMatrix`, `projectionMatrix`, `normalMatrix` → `vNormal`, `vViewPosition`, `vUv`, `vDepth`  
**Fragment Shader:** View-space normal dot product ile kenar yumuşatma; UV.y mesafe sönümü; derinlik yakın-geçiş

### PointsMaterial

| Kullanım | Dosya | Özellik |
|----------|-------|---------|
| Micro-bubble sistemi | `src/world/objects.js:115-122` | `size 0.10`, `CanvasTexture map`, `AdditiveBlending`, `vertexColors: true` |

---

## 🖼 Dokular (Textures)

Tüm dokular **prosedürel olarak** `HTML5 Canvas` üzerinden çizilir ve `THREE.CanvasTexture`'a sarılır. Harici hiçbir görüntü dosyası yüklenmez.

### `src/world/textures.js`

### `src/world/textures.js` — `textures.js` dosyasından dışa aktarılan fonksiyonlar

| Fonksiyon | Boyut | Kullanıldığı Yer | Ne Üretir |
|-----------|-------|-----------------|----------|
| `createRustMetalTexture()` | 512×512 | Tüm duvar/zemin/tavan materyalleri | Çelik plaka + pas lekeleri + gresi |
| `createRustMetalNormalMap()` | 512×512 | `normalMap` kanalı | Bölme çizgilerinden hesaplanan normal harita |
| `createDoorTexture()` | 512×1024 | Ana kapı `map` | Endüstriyel çelik kapı + sarı/siyah tehlike şeritleri |
| `createDoorRoughnessMap()` | 512×1024 | Kapı `roughnessMap` | Şerit bölgeleri mat, pahlanmış kenarlar parlak |
| `createDoorMetalnessMap()` | 512×1024 | Kapı `metalnessMap` | Boyalı şeritler sıfır metallik |
| `createDoorNormalMap()` | 512×1024 | Kapı `normalMap` | Canvas→ yükseklik farkı → normal vektörü |
| `createIronFrameTexture()` | 128×256 | Kapı çerçevesi | Siyah dökme demir tane dokusu |
| `createWheelTexture()` | 256×256 | Vana tekerlekleri, pirinç parçalar | Yağlanmış pirinç + oksidasyon |
| `createWoodTexture()` | 512×256 | Masa üstleri | Koyu ceviz ahşap + damarlar + düğümler |
| `createSimonConsoleTexture()` | 256×256 | Simon paneli | Askeri çizilmiş yeşil metal panel |
| `createGaugeScratchTexture()` | 256×256 | Manometre camı | Kırık cam çatlak haritası (alpha) |
| `createGeneratorTexture()` | 512×256 | Jeneratör kasası `map` | Endüstriyel çelik panel + yağ damlaları |
| `createGeneratorRoughnessMap()` | 512×256 | Jeneratör `roughnessMap` | Panel dikişleri pürüzlü, gres alanları çok pürüzlü |
| `createGeneratorMetalnessMap()` | 512×256 | Jeneratör `metalnessMap` | Gres alanları sıfır metallik |
| `createGeneratorNormalMap()` | 512×256 | Jeneratör `normalMap` | Panel bölme çizgilerinden normal |
| `createWaterNormalMap()` | 256×256 | Su yüzeyi `normalMap` | Simplex Noise + sin/cos dalgaları → su kırışıklığı |
| `createNormalMap(canvas, intensity)` | kaynak boyutunda | Tüm normal map üreticileri | Sobel türevi yükseklik → RGB normal vektörü |

### `src/world/objects.js` — yerel (dışa aktarılmayan) fonksiyonlar

| Fonksiyon | Boyut | Kullanıldığı Yer | Ne Üretir |
|-----------|-------|-----------------|----------|
| `createKeyTexture()` | 128×64 | Kaptan anahtarı `map` | Altın/pirinç anahtar renk gradyanı + çizikler |
| `createCoilTexture()` | 128×128 | Jeneratör bobini `map` | Bakır sarmal yatay şeritler (doğrudan objects.js içinde) |
| `createBubbleTexture()` | 64×64 | Partikül sistemi `PointsMaterial.map` | Cam görünümlü balon: refraksiyon halkası + iki highlight noktası |

### `src/puzzles/generator.js` — yerel fonksiyon

| Fonksiyon | Boyut | Kullanıldığı Yer | Ne Üretir |
|-----------|-------|-----------------|----------|
| `createCoilTexture()` (ayrı kopya) | 128×128 | Yerleştirilen bobin `map` | Bakır şerit dokusu (objects.js'dekiyle aynı mantık, bağımsız kopya) |

### Doku özellikleri:
- `wrapS / wrapT = THREE.RepeatWrapping` → tekrarlayan yüzeyler
- `minFilter = LinearMipmapLinearFilter` → uzaklaştıkça yumuşak LOD
- `magFilter = LinearFilter` → yakından temiz görüntü
- `anisotropy = 4` → eğik yüzeylerde keskinlik

### Prosedürel Noise

| Algoritma | Kullanım Yeri | Amaç |
|-----------|--------------|------|
| `SimplexNoise` (three/examples) | `textures.js` su normal map | Organik, tekrar etmeyen gürültü deseni |
| `Math.sin/cos + SimplexNoise overlay` | `textures.js:createWaterNormalMap()` | Gerçekçi su yüzeyi titreşim haritası |

---

## 📐 Geometriler

| Geometri | Kullanıldığı Dosyalar | Örnek kullanım |
|----------|-----------------------|----------------|
| `BoxGeometry` | `room.js`, `objects.js`, `valve.js`, `pressure.js`, `simon.js`, `breaker.js`, `door.js` | Duvarlar, tavanlar, zemin, mobilya, bölmeler |
| `SphereGeometry` | `lights.js`, `breaker.js`, `door.js`, `pressure.js` | Ampul görseli, indikatör topu, köre LED |
| `CylinderGeometry` | `lights.js`, `room.js`, `objects.js`, `puzzles/*` | Perçinler, boru, valf gövdesi, bobin merkezi |
| `TorusGeometry` | `breaker.js`, `door.js`, `generator.js`, `pressure.js` | Bobin halkası, el tekerleği, manometre çerçevesi |
| `PlaneGeometry` | `room.js`, `door.js`, `simon.js` | Su yüzeyi, void kutu, metin plakası |
| `CircleGeometry` | `pressure.js` | Manometre yüzü, merkez cap |
| `BufferGeometry` | `objects.js:88` | Partikül sistemi (bubble) pozisyon + renk buffer |

---

## 🧩 Geometri Detay Sistemi

**`addWallDetails(wallMesh, w, h)` — `src/world/room.js:38-69`**

Her duvar için:
- 1.0m ve 2.2m yüksekliğe **fiziksel 3D yatay panel dikişi** (`BoxGeometry 0.018` derinlik, `seamMat` malzeme)
- Her 0.55m'de bir **perçin** (`CylinderGeometry`, `rivetMat`) — gerçekçi endüstriyel kaplama görünümü

---

## 🚶 Kontroller ve Fizik

| Teknoloji | Kullanım Yeri | Detay |
|-----------|--------------|-------|
| `PointerLockControls` | `src/player/movement.js:2,6` | Mouse kilitli FPS kamera kontrolü |
| `THREE.Box3` (AABB) | `movement.js:51`, `door.js:13`, `valve.js:171`, `objects.js` | Oyuncu + nesne çarpışma kutuları |
| `THREE.Raycaster` | `src/player/interaction.js:6` | Crosshair raycast → etkileşim tespiti |
| `THREE.Vector3` | Tüm dosyalar | Hareket hesaplama, konum, yön vektörü |
| **Manuel yerçekimi** | `movement.js` | `velocityY += GRAVITY * delta` |
| **Merdiven sistemi** | `movement.js` | Bölge tespiti → `onLadder` flag |
| **Yüzme (isSwimming)** | `movement.js:83` | `camera.y < -0.5` → su altı modu |
| **Kamera sallantısı** | `main.js:200-206` | Sanity düştükçe rastgele offset, `originalPos` ile geri alım |
| **Suyun kaldırma kuvveti** | `movement.js` | `sin(time)` bazlı kamera Y ekseni salınımı |

---

## ✨ Partikül Sistemi (Micro-Bubbles)

**`src/world/objects.js:87-215`**

| Özellik | Değer |
|---------|-------|
| Partikül sayısı | 45 |
| Sistem tipi | `THREE.Points` + `BufferGeometry` |
| Materyal | `PointsMaterial` + `CanvasTexture` + `AdditiveBlending` |
| Renk sistemi | `vertexColors: true` — CPU'da per-vertex renk hesabı |
| Hareket | Yükseliş (driftY: 0.20-0.55 m/s) + sinüs yalpalama |
| Sınır | 8×8×8m kamera merkezli kutu — taşanlar karşı taraftan geri girer |
| Yeniden doğum | Tepe noktasına ulaşanlar altta rastgele X/Z'de yeniden doğar |
| Işık tepkisi | CPU raycast → flashlight koni içindeki balonlar cyan/mavi parlar |

---

## 🎭 Sahne Grafik Organizasyonu (THREE.Group)

| Group | Kullanım Yeri | İçerik |
|-------|--------------|--------|
| `emergencyGroup` | `lights.js:62` | 12× acil durum PointLight + kırmızı ampul |
| `mainLightsGroup` | `lights.js:95` | 12× beyaz SpotLight + soket + ampul üçlüsü |
| `boxGroup` (breaker) | `breaker.js:9` | Sigorta kutusu parçaları + kapı pivot |
| `coilGroup` | `breaker.js:54` | Bobin, halkalar, indikatör |
| `doorPivot` | `breaker.js:92` | Kapı menteşe pivot noktası |
| `pivot` (ana kapı) | `door.js:21` | Döner kapı menteşesi |
| `insertedCoilGroup` | `generator.js:78` | Eklenen ve dönen jeneratör bobini |
| `needleGroup` | `pressure.js:56` | Manometre ibresi pivot |
| `group` (pressure) | `pressure.js:23` | Tüm manometre + vana assambly |
| `doorGroup` (madRoom) | `room.js:395` | Karantina kapısı + zincirleri + kilit grubu |
| `lockGroup` | `room.js:502` | Asma kilit gövdesi + şakul (pivot+eğim ile) |
| `bedGroup`, `deskGroup`, `drawerGroup` | `objects.js` | Mobilya hiyerarşisi, bağımsız animasyon pivot'ları |
| `cabinLockerGroup`, `doorPivot` | `objects.js:435,476` | Dolap + döner kapı menteşe pivot |
| `consoleGroup` | `objects.js:1197` | Köprü konsolları grubu |
| `tabletGroup` | `objects.js:1284` | Her magnezyum tableti için bağımsız grup |
| `keyGroup` | `objects.js:322` | Kaptan anahtarı; `drawerGroup`'tan alınıp kaldırılır |
| Merdiven `group` | `room.js:225` | Basamak silindirleri hiyerarşisi (2 merdiven) |

### THREE.Quaternion & lerpVectors — Zincir Sistemi

**`src/world/room.js:528-554` (`buildVisualChain`)**

Karantina kapısının X zincirlerini oluşturmak için kullanılır:
- `new THREE.Quaternion().setFromUnitVectors(Z_eksen, direction)` → her halkanın yönünü hesaplar
- `new THREE.Vector3().lerpVectors(p1, p2, t)` → halkalar eşit aralıklarla yerleştirilir
- `pos.y -= sag * sin(t*PI)` → sarkma efekti
- `i % 2 === 0` ise `link.rotateZ(PI/2)` → gerçek zincir halkası dönüşümü
- `new THREE.Vector3().subVectors(p2, p1)` → yön vektörü hesabı

---

## 🎮 Oyun Mekaniği — WebGL/JS Birleşimi

| Mekanik | Teknoloji | Dosya |
|---------|-----------|------|
| Flashlight flicker | `sin(t * f)` multi-freq + sanity factor | `movement.js:66-80` |
| Flashlight intensity getter/setter | `Object.defineProperty` ile custom prop | `lights.js:194-204` |
| Flashlight visible getter/setter | Custom prop — spill + cone senkronizasyonu | `lights.js:206-216` |
| Kapı animasyonu | `rotation.y` lerp | `door.js`, `valve.js` |
| Kapı çarpışması dinamik | `Box3` disable/enable | `valve.js:171`, `door.js:13` |
| Jeneratör bobin dönüşü | `group.rotation.x += delta * 5.0` | `generator.js:125` |
| Simon Says buton flash | `emissive` + `emissiveIntensity` toggle | `simon.js:211-216` |
| Hover highlight | `emissive.setHex(0x060c12)` | `interaction.js:30` |
| Camera shake | Rastgele offset + `originalPos` geri alma | `main.js:199-213` |
| Güç kesintisi flicker sekansı | Zaman tabanlı `if/else` zinciri; `ambient/hemi/dir` renk+yoğunluk override | `generator.js:139-230` |
| `scene.getObjectByName()` traversal | `emergencyLights`, `mainLights`, `ambientLight`, `hemiLight`, `waterPlane`, `generator`, `madRoomDoor` ismiyle sahne arama | `generator.js`, `breaker.js`, `objects.js` |
| Kapı slits (dekoratif) | `BoxGeometry` + `MeshStandardMaterial` — gerçek 3D hava giriş delikleri | `objects.js:491-495` |
| Pump rotor dönüşü | `pumpRotor.rotation.z += delta * 4.5` — baskı puzzle'ı çözülünce başlar | `objects.js:216-218` |
| Bridge console ekranları | `emissiveIntensity` güç durumuna göre 0.0 ↔ 1.5 — `PlaneGeometry` üstünde neon renk | `objects.js:1235-1241` |
| Çekmece animasyonu | `drawerGroup.position.x` lerp → aç/kapat | `objects.js:385-412` |
| Dolap kapısı animasyonu | `doorPivot.rotation.y` lerp (0 ↔ -PI*0.65) | `objects.js:497-512` |

---

## 🌊 Su Yüzeyi

**`src/world/room.js:310-327`**

- `PlaneGeometry(7.0, 10.0)` — Y = `-0.8` (flooded room)
- `MeshStandardMaterial`: `color 0x143447`, `roughness 0.1`, `metalness 0.9`, `transparent opacity 0.75`, `normalMap`, `side: DoubleSide`
- `waterNormal.repeat.set(3, 4)` → dokuyu geniş yüzeye bölerek tekrarlar
- **Animasyon** (`src/world/objects.js:220-234`):
  - Her karede `normalMap.offset.x += delta * 0.04`, `offset.y += delta * 0.03` → UV kaydırma ile akan su illüzyonu
  - `state.waterDrained = true` ise su yüzeyi `delta * 0.75` hızla aşağı iner, Y = -3.95'e gelince `visible = false`
- Su altı kontrolü: `camera.y < -0.5` → `state.isSwimming = true` (`movement.js:83`)

---

## 🖥 HUD / UI Teknolojisi

**`src/ui/hud.js`, `src/ui/overlay.js`**

- Tamamen **HTML/CSS** bazlı (WebGL değil)
- `style.css` → glassmorphism, vignette, scanlines (CSS)
- Sanity/oksijen çubukları DOM üzerinden güncellenir
- Three.js render ile paralel — DOM katmanı WebGL üstünde

---

## 📊 Özet Sayılar

| Kategori | Adet |
|----------|------|
| Işık kaynağı (toplam) | 28 (1 Ambient + 1 Hemi + 1 Dir + 12 PointLight[emergency] + 12 SpotLight[main] + 1 SpotLight[flashlight] + 1 SpotLight[spill]) |
| MeshStandardMaterial instance | ~60+ |
| MeshBasicMaterial instance | ~12 |
| ShaderMaterial instance | 1 (volumetric flashlight cone) |
| CanvasTexture (prosedürel) | ~25 (textures.js'deki 16 + objects.js'deki 3 + generator.js + breaker.js + pressure.js + door.js + simon.js'deki) |
| SimplexNoise kullanımı | 1 (su normal map — `createWaterNormalMap`) |
| BufferGeometry (partikül) | 1 (45 balon) |
| THREE.Group | ~20+ |
| THREE.Quaternion | 1 (zincir yön hesabı) |
| bumpMap kullanımı | 4 nesne (kapı, valf kapısı, kabin kapısı, jeneratör) |
| Post-Processing Pass | 3 (RenderPass + UnrealBloomPass + OutputPass) |
| Shadow map | 1 (flashlight, 2048×2048, PCFSoftShadowMap) |
| `scene.getObjectByName()` çağrısı | 12+ (ışık, grup ve nesne erişimi için) |
