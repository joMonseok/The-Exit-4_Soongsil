class FullEngine {
  constructor(config) {
    this.config = config || {};
    if (!Array.isArray(this.config.worldMap) || !this.config.worldMap.length) {
      throw new Error('FullEngine requires config.worldMap (array)');
    }
    if (!this.config.player || typeof this.config.player !== 'object') {
      throw new Error('FullEngine requires config.player (object)');
    }
    if (!Array.isArray(this.config.assets) || !this.config.assets.length) {
      throw new Error('FullEngine requires config.assets (array of image paths)');
    }

    this.worldMap = this.config.worldMap.map(r => r.slice());
    this.mapHeight = this.worldMap.length;
    this.mapWidth = this.worldMap[0].length;

    this.screenWidth = this.config.screenWidth || 320;
    this.screenHeight = this.config.screenHeight || 200;
    this.stripWidth = this.config.stripWidth || 1;
    this.fov = this.config.fov || (60 * Math.PI / 180);
    this.viewDist = (this.screenWidth / 2) / Math.tan(this.fov / 2);
    this.twoPI = Math.PI * 2;

    this.player = Object.assign({ x: 0, y: 0, rot: 0, speed: 0, dir: 0, moveSpeed: 0.1, rotSpeed: 3 * Math.PI / 180 }, this.config.player);

    this.wallImages = [];
    this.screenLines = [];
    this._keyboardEnabled = false;
    this._boundKeyDown = this._onKeyDown.bind(this);
    this._boundKeyUp = this._onKeyUp.bind(this);
  }

  preload() {
    const assets = (Array.isArray(this.config.assets) && this.config.assets.length) ? this.config.assets : (window.ENGINE_ASSETS || []);
    try { window.ENGINE_ASSETS = assets.slice(); } catch (e) {}
    this.wallImages = assets.map(src => loadImage(src));
    // optional floor/ceiling textures (paths provided via config.floorTexture / config.ceilingTexture)
    this.floorImage = this.config.floorTexture ? loadImage(this.config.floorTexture) : null;
    this.ceilingImage = this.config.ceilingTexture ? loadImage(this.config.ceilingTexture) : null;
  }

  setup() {
    this.canvas = createCanvas(this.screenWidth, this.screenHeight);
    const canvasEl = document.getElementById('defaultCanvas0');
    if (canvasEl) { try { const ctx = canvasEl.getContext('2d'); ctx.imageSmoothingEnabled = false; } catch (e) {} }
    this.fitCanvasToWindow();
    window.addEventListener('resize', () => this.fitCanvasToWindow());
  }

  fitCanvasToWindow() { 
   const canvasEl = document.getElementById('defaultCanvas0'); 
   if (!canvasEl) return; 
   const scale = Math.min(window.innerWidth / this.screenWidth, window.innerHeight / this.screenHeight); 
   const cssW = Math.max(1, Math.round(this.screenWidth * scale)); 
   const cssH = Math.max(1, Math.round(this.screenHeight * scale)); 
   canvasEl.style.width = cssW + 'px'; 
   canvasEl.style.height = cssH + 'px'; 
   canvasEl.style.position = 'absolute'; 
   canvasEl.style.left = '50%'; 
   canvasEl.style.top = '50%'; 
   canvasEl.style.transform = 'translate(-50%,-50%)'; 
   document.body.style.margin = '0'; 
   document.body.style.overflow = 'hidden'; 
  }

  Go() { 
   try { 
      this.renderFrame(); 
   } 
   catch (err) 
   { 
      console.error('FullEngine.Go error', err);
   } 
   const frontX = this.player.x + Math.cos(this.player.rot) * 1; 
   const frontY = this.player.y + Math.sin(this.player.rot) * 1; 
   let frontBlock = null; 
  let frontBlockX = null, frontBlockY = null, frontBlockPos = null;
  if (Number.isFinite(frontX) && Number.isFinite(frontY) && frontY >= 0 && frontY < this.mapHeight && frontX >= 0 && frontX < this.mapWidth) 
  { 
    frontBlockX = Math.floor(frontX);
    frontBlockY = Math.floor(frontY);
    frontBlock = this.worldMap[frontBlockY][frontBlockX];
  }
  const frontRay = this.castRayInfo(this.player.rot);
  return { frontBlock, frontBlockX, frontBlockY, frontRay, playerX: this.player.x, playerY: this.player.y};
  }

  renderFrame() { clear(); this.resetScreenDefaults(); this.drawScreen(); this.move(); }
  resetScreenDefaults() { fill(255); stroke(0); strokeWeight(1); }

  drawScreen() {
    noStroke();
    // Draw floor: if a floorImage is provided, tile it; otherwise draw flat color
    const halfH = Math.floor(this.screenHeight / 2);
    const tileSize = this.config.tileSize || 64;
    if (this.floorImage) {
      for (let ty = 0; ty < halfH; ty += tileSize) {
        for (let tx = 0; tx < this.screenWidth; tx += tileSize) {
          image(this.floorImage, tx, halfH + ty, tileSize, tileSize);
        }
      }
    } else {
      fill(color(130)); rect(0, halfH, this.screenWidth, halfH);
    }

    // Draw ceiling
    if (this.ceilingImage) {
      for (let ty = 0; ty < halfH; ty += tileSize) {
        for (let tx = 0; tx < this.screenWidth; tx += tileSize) {
          image(this.ceilingImage, tx, ty, tileSize, tileSize);
        }
      }
    } else {
      fill(color(65)); rect(0, 0, this.screenWidth, halfH);
    }
    this.screenLines = [];
    const numRays = Math.ceil(this.screenWidth / this.stripWidth);
    for (let i = 0; i < numRays; i++) {
      const rayScreenPos = (-numRays / 2 + i) * this.stripWidth;
      const rayViewDist = Math.sqrt(rayScreenPos * rayScreenPos + this.viewDist * this.viewDist);
      const rayAngle = Math.asin(rayScreenPos / rayViewDist);
      const info = this.castRayInfo(this.player.rot + rayAngle);
      this.screenLines.push(info.hit ? info : null);
    }
    for (let px = 0; px < this.screenWidth; px += this.stripWidth) {
      const idx = Math.floor(px / this.stripWidth); const info = this.screenLines[idx]; if (!info) continue;
      fill(0); noStroke(); rect(px, info.top, this.stripWidth, info.height);
      const img = this.wallImages[info.wallType - 1]; if (img) image(img, px, info.top, this.stripWidth, info.height, (64 * info.texX) / info.width, 0, this.stripWidth, 64);
    }
  }

  move() { const moveStep = (this.player.speed || 0) * (this.player.moveSpeed || 0.1); this.player.rot += (this.player.dir || 0) * (this.player.rotSpeed || (3 * Math.PI / 180)); const newX = this.player.x + Math.cos(this.player.rot) * moveStep; const newY = this.player.y + Math.sin(this.player.rot) * moveStep; if (this.isBlocking(newX, newY)) return; this.player.x = newX; this.player.y = newY; }

  isBlocking(x, y) { 
    if (!Number.isFinite(x) || !Number.isFinite(y)) 
        return true; 
    const ix = Math.floor(x), iy = Math.floor(y); 
    if (iy < 0 || iy >= this.mapHeight || ix < 0 || ix >= this.mapWidth) 
      return true; 
    const row = this.worldMap[iy]; 
    if (!row) return true; 
    return (row[ix] > 0); 
  }

  castRayInfo(rayAngle) {
    rayAngle %= this.twoPI; if (rayAngle < 0) rayAngle += this.twoPI;
    const right = (rayAngle > this.twoPI * 0.75 || rayAngle < this.twoPI * 0.25);
    const up = (rayAngle < 0 || rayAngle > Math.PI);
    const angleSin = Math.sin(rayAngle), angleCos = Math.cos(rayAngle);
    let dist = 0, xHit = 0, yHit = 0, textureX = 0, wallType = 0;

    let slope = angleSin / (angleCos || 1e-9);
    let dXVer = right ? 1 : -1, dYVer = dXVer * slope;
    let x = right ? Math.ceil(this.player.x) : Math.floor(this.player.x);
    let y = this.player.y + (x - this.player.x) * slope;
    while (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
      const wallX = Math.floor(x + (right ? 0 : -1)); const wallY = Math.floor(y);
      if (this.worldMap[wallY][wallX] > 0) { const dx = x - this.player.x, dy = y - this.player.y; dist = dx * dx + dy * dy; wallType = this.worldMap[wallY][wallX]; textureX = y % 1; if (!right) textureX = 1 - textureX; xHit = x; yHit = y; break; }
      x += dXVer; y += dYVer;
    }

    slope = angleCos / (angleSin || 1e-9);
    let dYHor = up ? -1 : 1, dXHor = dYHor * slope;
    y = up ? Math.floor(this.player.y) : Math.ceil(this.player.y);
    x = this.player.x + (y - this.player.y) * slope;
    while (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
      const wallY = Math.floor(y + (up ? -1 : 0)); const wallX = Math.floor(x);
      if (this.worldMap[wallY][wallX] > 0) { const dx = x - this.player.x, dy = y - this.player.y; const blockDist = dx * dx + dy * dy; if (!dist || blockDist < dist) { dist = blockDist; xHit = x; yHit = y; wallType = this.worldMap[wallY][wallX]; textureX = x % 1; } break; }
      x += dXHor; y += dYHor;
    }

    if (!dist) return { hit: false };
    const rawDist = Math.sqrt(dist); const correctedDist = rawDist * Math.cos(this.player.rot - rayAngle);
    const height = Math.round(this.viewDist / (correctedDist || 1e-9)); const width = height * this.stripWidth;
    const top = Math.round((this.screenHeight - height) / 2);
    let texX = Math.round(textureX * width); if (texX > width - this.stripWidth) texX = width - this.stripWidth;
    return { hit: true, wallType, dist: correctedDist, rawDist, xHit, yHit, textureX, texX, height, width, top };
  }

  _onKeyDown(e) { const code = e.keyCode || e.which || 0; if (code === 37) this.player.dir = -1; if (code === 39) this.player.dir = 1; if (code === 38) this.player.speed = 1; if (code === 40) this.player.speed = -1; }
  _onKeyUp(e) { const code = e.keyCode || e.which || 0; if (code === 37 || code === 39) this.player.dir = 0; if (code === 38 || code === 40) this.player.speed = 0; }

  enableKeyboard() { if (this._keyboardEnabled) return; this._keyboardEnabled = true; window.addEventListener('keydown', this._boundKeyDown, { passive: false }); window.addEventListener('keyup', this._boundKeyUp, { passive: false }); }
  disableKeyboard() { if (!this._keyboardEnabled) return; this._keyboardEnabled = false; window.removeEventListener('keydown', this._boundKeyDown); window.removeEventListener('keyup', this._boundKeyUp); }

  addFullscreenButton(opts) { opts = opts || {}; const label = opts.label || 'Toggle Fullscreen'; const btn = document.createElement('button'); btn.textContent = label; btn.style.position = 'fixed'; btn.style.right = '12px'; btn.style.top = '12px'; btn.style.zIndex = 9999; document.body.appendChild(btn); btn.addEventListener('click', async () => { const canvasEl = document.getElementById('defaultCanvas0'); if (!canvasEl) return; if (!document.fullscreenElement) { try { await canvasEl.requestFullscreen(); } catch (e) { console.warn(e); } } else { try { await document.exitFullscreen(); } catch (e) { console.warn(e); } } }); return btn; }

  destroy() { try { this.disableKeyboard(); } catch (e) {} }

  setWorldMap(newMap) {
    if (!Array.isArray(newMap) || !newMap.length) return;
    this.worldMap = newMap.map(r => r.slice());
  }
  setBlock(x, y, type) {
    if (y < 0 || y >= this.mapHeight || x < 0 || x >= this.mapWidth) return;
    this.worldMap[y][x] = type;
  }
  setPlayerLoc(x, y) {
    if (y < 0 || y >= this.mapHeight || x < 0 || x >= this.mapWidth) return;
    this.player.x = x;
    this.player.y = y;
  }
  getPlayerBlock() {
    const px = Math.floor(this.player.x);
    const py = Math.floor(this.player.y);
    if (py < 0 || py >= this.mapHeight || px < 0 || px >= this.mapWidth) return null;
    return this.worldMap[py][px];
  }
  getPlayerLocX()
  {
    return this.player.x;
  }
  getPlayerLocY()
  {
    return this.player.y;
  }
}

window.FullEngine = FullEngine;