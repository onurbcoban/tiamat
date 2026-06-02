import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

export function createNormalMap(sourceCanvas, intensity = 1.0) {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const srcCtx = sourceCanvas.getContext('2d');
  const srcData = srcCtx.getImageData(0, 0, width, height).data;

  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = width;
  normalCanvas.height = height;
  const normCtx = normalCanvas.getContext('2d');
  const normData = normCtx.createImageData(width, height);
  const data = normData.data;

  function getHeight(x, y) {
    const cx = Math.max(0, Math.min(width - 1, x));
    const cy = Math.max(0, Math.min(height - 1, y));
    const idx = (cy * width + cx) * 4;
    return (srcData[idx] + srcData[idx + 1] + srcData[idx + 2]) / 3.0;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const hL = getHeight(x - 1, y);
      const hR = getHeight(x + 1, y);
      const hT = getHeight(x, y - 1);
      const hB = getHeight(x, y + 1);

      const dX = ((hR - hL) / 255.0) * intensity;
      const dY = ((hB - hT) / 255.0) * intensity;

      const len = Math.sqrt(dX * dX + dY * dY + 1.0);
      const nx = -dX / len;
      const ny = -dY / len;
      const nz = 1.0 / len;

      const idx = (y * width + x) * 4;
      data[idx]     = Math.floor((nx * 0.5 + 0.5) * 255);
      data[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
      data[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
      data[idx + 3] = 255;
    }
  }

  normCtx.putImageData(normData, 0, 0);
  const texture = new THREE.CanvasTexture(normalCanvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}



export function createRustMetalTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#2d353b';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = 1 + Math.random() * 2;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(x, y, size, size);
  }

  for (let i = 0; i < 6; i++) { 
    const rx = Math.random() * 512;
    const ry = Math.random() * 512;
    const radius = 4 + Math.random() * 10; 
    
    
    const radGrad = ctx.createRadialGradient(rx, ry, 1, rx, ry, radius);
    radGrad.addColorStop(0, 'rgba(120, 55, 15, 0.35)'); 
    radGrad.addColorStop(0.5, 'rgba(160, 90, 30, 0.15)'); 
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(rx, ry, radius, 0, Math.PI * 2);
    ctx.fill();

    // Very fine, faint vertical grime drips
    if (Math.random() > 0.3) {
      const dripLength = 15 + Math.random() * 45;
      const dripGrad = ctx.createLinearGradient(rx, ry, rx, ry + dripLength);
      dripGrad.addColorStop(0, 'rgba(100, 50, 15, 0.25)');
      dripGrad.addColorStop(0.7, 'rgba(120, 70, 20, 0.08)');
      dripGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = dripGrad;
      ctx.fillRect(rx - 0.7, ry, 1.4 + Math.random() * 1.0, dripLength);
    }
  }

  
  ctx.fillStyle = 'rgba(10, 15, 20, 0.2)';
  for (let i = 0; i < 5; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 512;
    const radius = 15 + Math.random() * 25;
    const grad = ctx.createRadialGradient(rx, ry, 2, rx, ry, radius);
    grad.addColorStop(0, 'rgba(10, 15, 20, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(rx, ry, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 4;
  return texture;
}


export function createSimonConsoleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  
  ctx.fillStyle = '#222b28';
  ctx.fillRect(0, 0, 256, 256);

  
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(x, y, 1, 1);
  }

  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 25; i++) {
    const x1 = Math.random() * 256;
    const y1 = Math.random() * 256;
    const length = 5 + Math.random() * 20;
    const angle = Math.random() * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + length * Math.cos(angle), y1 + length * Math.sin(angle));
    ctx.stroke();
  }

 
  ctx.fillStyle = 'rgba(10, 15, 10, 0.3)';
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 10 + Math.random() * 25;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 4;
  return texture;
}


export function createGaugeScratchTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');


  ctx.fillStyle = 'rgba(10, 15, 20, 0.02)';
  ctx.fillRect(0, 0, 256, 256);

 
  const ix = 80;
  const iy = 155;

  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  

  for (let i = 0; i < 22; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 1 + Math.random() * 9; 
    const lx = ix + dist * Math.cos(angle);
    const ly = iy + dist * Math.sin(angle);
    
    ctx.lineWidth = 0.15 + Math.random() * 0.25; 
    ctx.beginPath();
    ctx.moveTo(ix, iy);
    ctx.lineTo(lx, ly);
    
    if (Math.random() > 0.5) {
      const angle2 = angle + (Math.random() - 0.5) * 1.0;
      ctx.lineTo(lx + (3 + Math.random() * 3) * Math.cos(angle2), ly + (3 + Math.random() * 3) * Math.sin(angle2));
    }
    ctx.stroke();
  }


  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  for (let i = 0; i < 7; i++) {
    const angle = (i * Math.PI * 2) / 7 + (Math.random() - 0.5) * 0.3;
    const length = 10 + Math.random() * 16; // Short radius spread
    const midLength = length * 0.5;

    const midX = ix + midLength * Math.cos(angle + (Math.random() - 0.5) * 0.4);
    const midY = iy + midLength * Math.sin(angle + (Math.random() - 0.5) * 0.4);
    const tx = ix + length * Math.cos(angle);
    const ty = iy + length * Math.sin(angle);

  
    ctx.lineWidth = 0.22;
    ctx.beginPath();
    ctx.moveTo(ix, iy);
    ctx.lineTo(midX, midY);
    ctx.stroke();

  
    ctx.lineWidth = 0.08;
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  }


  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 0.18;
  for (let i = 0; i < 15; i++) {
    const r = 3 + Math.random() * 7;
    const start = Math.random() * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(ix, iy, r, start, start + 0.3 + Math.random() * 1.0);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}


export function createDoorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');


  ctx.fillStyle = '#222b32';
  ctx.fillRect(0, 0, 512, 1024);


  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 1024;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(x, y, 1, 1);
  }


  ctx.strokeStyle = 'rgba(10, 15, 20, 0.85)';
  ctx.lineWidth = 9.0;
  ctx.beginPath();
  
  ctx.strokeRect(36, 36, 440, 952);
  ctx.stroke();


  ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  ctx.strokeRect(38, 38, 436, 948);
  ctx.stroke();


  const stripeW = 32;
  for (let y = 0; y < 1024; y += 48) {
    ctx.fillStyle = '#ccaa22'; 

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(stripeW, y + 24);
    ctx.lineTo(stripeW, y + 48);
    ctx.lineTo(0, y + 24);
    ctx.fill();


    ctx.beginPath();
    ctx.moveTo(512 - stripeW, y);
    ctx.lineTo(512, y + 24);
    ctx.lineTo(512, y + 48);
    ctx.lineTo(512 - stripeW, y + 24);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}


export function createIronFrameTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');


  ctx.fillStyle = '#14181c';
  ctx.fillRect(0, 0, 128, 256);


  for (let i = 0; i < 1500; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 256;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x, y, 1, 1);
  }


  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * 128;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (Math.random() - 0.5) * 5, 256);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}


export function createWheelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#8c7c32';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = 'rgba(15, 15, 15, 0.55)';
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 8 + Math.random() * 30;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(95, 40, 15, 0.4)';
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 5 + Math.random() * 20;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 4;
  return texture;
}


export function createWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#150d07';
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = 'rgba(10, 5, 2, 0.4)';
  ctx.lineWidth = 0.6;
  for (let y = 0; y < 256; y += 14 + Math.random() * 16) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 512; x += 32) {
      const wave = Math.sin(x * 0.015) * 6 + Math.cos(x * 0.04) * 3;
      ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(12, 6, 3, 0.4)';
  for (let k = 0; k < 2; k++) {
    const kx = 120 + Math.random() * 260;
    const ky = 60 + Math.random() * 130;
    const maxRadius = 8 + Math.random() * 8;
    
    for (let r = 1.5; r < maxRadius; r += 2.5) {
      ctx.strokeStyle = `rgba(15, 8, 4, ${0.45 - (r / maxRadius) * 0.3})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(kx, ky, r * 2.8, r, (Math.random() - 0.5) * 0.1, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  for (let i = 0; i < 3; i++) {
    const sx = Math.random() * 512;
    const sy = Math.random() * 256;
    const radius = 18 + Math.random() * 15;
    
    const grad = ctx.createRadialGradient(sx, sy, 2, sx, sy, radius);
    grad.addColorStop(0, 'rgba(10, 5, 2, 0.3)');
    grad.addColorStop(0.7, 'rgba(15, 8, 4, 0.06)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    const len = 6 + Math.random() * 12;
    const angle = (Math.random() - 0.5) * 0.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len * Math.cos(angle), y + len * Math.sin(angle));
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

export function createGeneratorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#20252b';
  ctx.fillRect(0, 0, 512, 256);

  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.18)';
    ctx.fillRect(x, y, 1, 1);
  }

  ctx.strokeStyle = 'rgba(10, 15, 12, 0.8)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(128, 0); ctx.lineTo(128, 256);
  ctx.moveTo(256, 0); ctx.lineTo(256, 256);
  ctx.moveTo(384, 0); ctx.lineTo(384, 256);
  ctx.moveTo(0, 128); ctx.lineTo(512, 128);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(129, 0); ctx.lineTo(129, 256);
  ctx.moveTo(257, 0); ctx.lineTo(257, 256);
  ctx.moveTo(0, 129); ctx.lineTo(512, 129);
  ctx.stroke();

  for (let i = 0; i < 6; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 100;
    const dripLen = 20 + Math.random() * 90;
    
    const grad = ctx.createLinearGradient(rx, ry, rx, ry + dripLen);
    grad.addColorStop(0, 'rgba(10, 12, 8, 0.45)');
    grad.addColorStop(0.7, 'rgba(15, 18, 12, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = grad;
    ctx.fillRect(rx - 1.5, ry, 3 + Math.random() * 2, dripLen);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

export function createGeneratorRoughnessMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#737373';
  ctx.fillRect(0, 0, 512, 256);

  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(x, y, 1, 1);
  }

  ctx.strokeStyle = 'rgba(200, 200, 200, 0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(128, 0); ctx.lineTo(128, 256);
  ctx.moveTo(256, 0); ctx.lineTo(256, 256);
  ctx.moveTo(384, 0); ctx.lineTo(384, 256);
  ctx.moveTo(0, 128); ctx.lineTo(512, 128);
  ctx.stroke();

  for (let i = 0; i < 6; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 100;
    const dripLen = 20 + Math.random() * 90;
    
    const grad = ctx.createLinearGradient(rx, ry, rx, ry + dripLen);
    grad.addColorStop(0, 'rgba(230, 230, 230, 0.65)');
    grad.addColorStop(1, 'rgba(115, 115, 115, 0)');
    
    ctx.fillStyle = grad;
    ctx.fillRect(rx - 1.5, ry, 3 + Math.random() * 2, dripLen);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

export function createGeneratorMetalnessMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#cccccc';
  ctx.fillRect(0, 0, 512, 256);

  for (let i = 0; i < 6; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 100;
    const dripLen = 20 + Math.random() * 90;
    
    const grad = ctx.createLinearGradient(rx, ry, rx, ry + dripLen);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    grad.addColorStop(1, 'rgba(204, 204, 204, 0)');
    
    ctx.fillStyle = grad;
    ctx.fillRect(rx - 1.5, ry, 3 + Math.random() * 2, dripLen);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

export function createDoorRoughnessMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#8c8c8c';
  ctx.fillRect(0, 0, 512, 1024);

  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 1024;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
    ctx.fillRect(x, y, 1, 1);
  }

  ctx.fillStyle = 'rgba(220, 220, 220, 0.4)';
  ctx.fillRect(0, 0, 32, 1024);
  ctx.fillRect(512 - 32, 0, 32, 1024);

  ctx.strokeStyle = 'rgba(40, 40, 40, 0.6)';
  ctx.lineWidth = 8;
  ctx.strokeRect(36, 36, 440, 952);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

export function createDoorMetalnessMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#cccccc';
  ctx.fillRect(0, 0, 512, 1024);

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 32, 1024);
  ctx.fillRect(512 - 32, 0, 32, 1024);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

export function createDoorNormalMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 1024);
  
  ctx.strokeStyle = '#303030';
  ctx.lineWidth = 12;
  ctx.strokeRect(36, 36, 440, 952);
  
  ctx.strokeStyle = '#d0d0d0';
  ctx.lineWidth = 3;
  ctx.strokeRect(42, 42, 428, 940);
  
  ctx.strokeStyle = '#303030';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(36, 341); ctx.lineTo(476, 341);
  ctx.moveTo(36, 682); ctx.lineTo(476, 682);
  ctx.stroke();
  
  ctx.strokeStyle = '#d0d0d0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(36, 346); ctx.lineTo(476, 346);
  ctx.moveTo(36, 687); ctx.lineTo(476, 687);
  ctx.stroke();

  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 1024;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
    ctx.fillRect(x, y, 1, 1);
  }

  const texture = createNormalMap(canvas, 2.0);
  return texture;
}

export function createGeneratorNormalMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 256);
  
  ctx.strokeStyle = '#303030';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(128, 0); ctx.lineTo(128, 256);
  ctx.moveTo(256, 0); ctx.lineTo(256, 256);
  ctx.moveTo(384, 0); ctx.lineTo(384, 256);
  ctx.moveTo(0, 128); ctx.lineTo(512, 128);
  ctx.stroke();
  
  ctx.strokeStyle = '#d0d0d0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(129, 0); ctx.lineTo(129, 256);
  ctx.moveTo(257, 0); ctx.lineTo(257, 256);
  ctx.moveTo(385, 0); ctx.lineTo(385, 256);
  ctx.moveTo(0, 129); ctx.lineTo(512, 129);
  ctx.stroke();
  
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(x, y, 1, 1);
  }

  const texture = createNormalMap(canvas, 1.8);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createRustMetalNormalMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);
  
  ctx.strokeStyle = '#404040';
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, 512, 512);
  
  ctx.beginPath();
  ctx.moveTo(256, 0); ctx.lineTo(256, 512);
  ctx.moveTo(0, 256); ctx.lineTo(512, 256);
  ctx.stroke();
  
  ctx.strokeStyle = '#c0c0c0';
  ctx.lineWidth = 2;
  ctx.strokeRect(3, 3, 506, 506);
  
  ctx.beginPath();
  ctx.moveTo(258, 0); ctx.lineTo(258, 512);
  ctx.moveTo(0, 258); ctx.lineTo(512, 258);
  ctx.stroke();

  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(x, y, 1, 1);
  }

  const texture = createNormalMap(canvas, 1.5);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

export function createWaterNormalMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  const simplex = new SimplexNoise();
  const imgData = ctx.getImageData(0, 0, 256, 256);
  const data = imgData.data;

  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const nx = x / 256;
      const ny = y / 256;
      
      const w1 = Math.sin(nx * Math.PI * 8.0) * Math.cos(ny * Math.PI * 8.0);
      const w2 = Math.sin((nx + ny) * Math.PI * 12.0) * 0.5;
      const noise = simplex.noise(nx * 5.0, ny * 5.0) * 0.3;
      
      const heightVal = Math.floor((0.5 + (w1 + w2 + noise) * 0.25) * 255);
      
      const idx = (y * 256 + x) * 4;
      data[idx] = heightVal;
      data[idx+1] = heightVal;
      data[idx+2] = heightVal;
      data[idx+3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = createNormalMap(canvas, 1.2);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}


