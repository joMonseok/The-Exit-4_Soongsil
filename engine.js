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
    this.sprites = []; // {x, y, img, id?} — 월드 좌표에 배치된 스프라이트들
    this._keyboardEnabled = false;
    this._boundKeyDown = this._onKeyDown.bind(this);
    this._boundKeyUp = this._onKeyUp.bind(this);
  }

  preload() {
    const assets = (Array.isArray(this.config.assets) && this.config.assets.length) ? this.config.assets : (window.ENGINE_ASSETS || []);
    try { window.ENGINE_ASSETS = assets.slice(); } catch (e) {}
    this.wallImages = assets.map(src => loadImage(src));
    // If textureSize wasn't specified in config, try to detect it from the first loaded image.
    // This runs during p5 preload, so images will have their width/height available.
    if (!this.config.textureSize) {
      const firstImg = this.wallImages[0];
      if (firstImg && firstImg.width && Number.isFinite(firstImg.width)) {
        this.textureSize = firstImg.width;
      }
    }
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
        const img = this.wallImages[info.wallType - 1]; 
        if (img) {
          // Prefer the actual image width/height if available (more robust detection),
          // otherwise fall back to this.textureSize which may be set from config or detection.
          const srcSize = (img.width && Number.isFinite(img.width)) ? img.width : this.textureSize;
          const srcX = (srcSize * info.texX) / info.width;
          image(img, px, info.top, this.stripWidth, info.height, srcX, 0, this.stripWidth, srcSize);
        }
    }
    // 스프라이트 렌더링 (벽 뒤 오클루전 처리 포함)
    this.drawSprites();
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
  setPlayerRot(rot) {
    this.player.rot = rot;
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
  getPlayerRot()
  {
    return this.player.rot;
  }

  // === 스프라이트 관리 메서드 ===
  /**
   * 스프라이트 추가: {x, y, img, id?, rot?, images?}
   * x, y는 월드 좌표 (타일 중심은 정수+0.5)
   * rot: 스프라이트가 바라보는 방향 (라디안, 선택사항)
   * images: 방향별 이미지 {front, back, left, right} 또는 단일 img
   */
  addSprite(sprite) {
    if (!sprite) return;
    // 단일 이미지 또는 방향별 이미지 지원
    if (!sprite.img && !sprite.images) return;
    
    // rot 기본값 설정 (0 = 오른쪽)
    if (sprite.rot === undefined) sprite.rot = 0;
    
    this.sprites.push(sprite);
    return sprite;
  }
  removeSprite(id) {
    this.sprites = this.sprites.filter(s => s.id !== id);
  }
  clearSprites() {
    this.sprites = [];
  }

  /**
   * ID로 스프라이트 찾기
   */
  getSprite(id) {
    return this.sprites.find(s => s.id === id);
  }

  /**
   * 스프라이트 위치 업데이트 (실시간 이동)
   * @param {string|number} id - 스프라이트 ID
   * @param {number} x - 새 X 좌표
   * @param {number} y - 새 Y 좌표
   * @returns {boolean} 성공 여부
   */
  updateSpritePosition(id, x, y) {
    const sprite = this.getSprite(id);
    if (!sprite) return false;
    sprite.x = x;
    sprite.y = y;
    return true;
  }

  /**
   * 스프라이트 방향(회전) 설정
   * @param {string|number} id - 스프라이트 ID
   * @param {number} rot - 방향 (라디안)
   * @returns {boolean} 성공 여부
   */
  updateSpriteRotation(id, rot) {
    const sprite = this.getSprite(id);
    if (!sprite) return false;
    sprite.rot = rot;
    return true;
  }

  /**
   * 스프라이트 이미지 교체 (애니메이션 등)
   * @param {string|number} id - 스프라이트 ID
   * @param {p5.Image} newImg - 새 이미지
   * @returns {boolean} 성공 여부
   */
  updateSpriteImage(id, newImg) {
    const sprite = this.getSprite(id);
    if (!sprite || !newImg) return false;
    sprite.img = newImg;
    return true;
  }

  /**
   * 스프라이트 방향별 이미지 설정
   * @param {string|number} id - 스프라이트 ID
   * @param {Object} images - {front, back, left, right}
   */
  updateSpriteImages(id, images) {
    const sprite = this.getSprite(id);
    if (!sprite || !images) return false;
    sprite.images = images;
    return true;
  }

  /**
   * 스프라이트를 특정 방향으로 이동 (방향도 자동 업데이트)
   * @param {string|number} id - 스프라이트 ID
   * @param {number} dx - X 방향 이동량
   * @param {number} dy - Y 방향 이동량
   * @param {boolean} checkCollision - 충돌 체크 여부 (기본 true)
   * @param {boolean} updateRotation - 이동 방향으로 회전 업데이트 (기본 true)
   * @returns {boolean} 성공 여부
   */
  moveSprite(id, dx, dy, checkCollision = true, updateRotation = true) {
    const sprite = this.getSprite(id);
    if (!sprite) return false;
    
    const newX = sprite.x + dx;
    const newY = sprite.y + dy;
    
    // 충돌 체크 옵션
    if (checkCollision && this.isBlocking(newX, newY)) {
      return false;
    }
    
    sprite.x = newX;
    sprite.y = newY;
    
    // 이동 방향으로 회전 업데이트
    if (updateRotation && (dx !== 0 || dy !== 0)) {
      sprite.rot = Math.atan2(dy, dx);
    }
    
    return true;
  }

  /**
   * 스프라이트를 목표 지점으로 이동 (부드러운 이동 + 방향 전환)
   * @param {string|number} id - 스프라이트 ID
   * @param {number} targetX - 목표 X 좌표
   * @param {number} targetY - 목표 Y 좌표
   * @param {number} speed - 이동 속도 (0.1 = 느림, 1.0 = 빠름)
   * @param {boolean} checkCollision - 충돌 체크 여부
   * @param {boolean} updateRotation - 이동 방향으로 회전 (기본 true)
   * @returns {boolean} 목표에 도달했는지 여부
   */
  moveSpriteTowards(id, targetX, targetY, speed = 0.05, checkCollision = true, updateRotation = true) {
    const sprite = this.getSprite(id);
    if (!sprite) return false;
    
    const dx = targetX - sprite.x;
    const dy = targetY - sprite.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    // 이미 목표에 도달
    if (dist < 0.01) return true;
    
    // 방향 업데이트
    if (updateRotation) {
      sprite.rot = Math.atan2(dy, dx);
    }
    
    // 정규화된 방향 벡터에 속도 곱하기
    const moveX = (dx / dist) * speed;
    const moveY = (dy / dist) * speed;
    
    // 목표를 지나치지 않도록
    if (dist < speed) {
      sprite.x = targetX;
      sprite.y = targetY;
      return true;
    }
    
    const newX = sprite.x + moveX;
    const newY = sprite.y + moveY;
    
    if (checkCollision && this.isBlocking(newX, newY)) {
      return false;
    }
    
    sprite.x = newX;
    sprite.y = newY;
    return false;
  }

  /**
   * 스프라이트를 플레이어 방향으로 이동 (AI 추적)
   * @param {string|number} id - 스프라이트 ID
   * @param {number} speed - 이동 속도
   * @param {boolean} checkCollision - 충돌 체크
   * @param {boolean} updateRotation - 회전 업데이트
   * @returns {boolean} 성공 여부
   */
  moveSpriteTowardsPlayer(id, speed = 0.05, checkCollision = true, updateRotation = true) {
    return this.moveSpriteTowards(id, this.player.x, this.player.y, speed, checkCollision, updateRotation);
  }

  /**
   * 스프라이트가 현재 바라보는 방향에 따라 적절한 이미지 선택
   * 플레이어 기준 상대 각도로 앞/뒤/좌/우 판단
   * @param {Object} sprite - 스프라이트 객체
   * @returns {p5.Image} 현재 방향에 맞는 이미지
   */
  _getSpriteDirectionalImage(sprite) {
    // 방향별 이미지가 없으면 기본 img 사용
    if (!sprite.images) return sprite.img;
    
    // 스프라이트 → 플레이어 방향 계산
    const dx = this.player.x - sprite.x;
    const dy = this.player.y - sprite.y;
    const angleToPlayer = Math.atan2(dy, dx);
    
    // 스프라이트의 방향과 플레이어 방향의 상대 각도
    let relAngle = angleToPlayer - sprite.rot;
    
    // -PI ~ PI 범위로 정규화
    while (relAngle > Math.PI) relAngle -= Math.PI * 2;
    while (relAngle < -Math.PI) relAngle += Math.PI * 2;
    
    // 8방향으로 나누어 앞/뒤/좌/우 판단
    const absAngle = Math.abs(relAngle);
    
    if (absAngle < Math.PI / 4) {
      // 앞 (플레이어가 스프라이트 정면)
      return sprite.images.front || sprite.img;
    } else if (absAngle > Math.PI * 3 / 4) {
      // 뒤 (플레이어가 스프라이트 뒤)
      return sprite.images.back || sprite.img;
    } else if (relAngle > 0) {
      // 왼쪽
      return sprite.images.left || sprite.img;
    } else {
      // 오른쪽
      return sprite.images.right || sprite.img;
    }
  }

  /**
   * 스프라이트 렌더링 (벽 뒤 오클루전 처리) - 성능 최적화 버전
   * drawScreen()에서 벽 렌더 후 호출됨
   */
  drawSprites() {
    if (!this.sprites.length) return;
    const px = this.player.x;
    const py = this.player.y;
    const prot = this.player.rot;
    const halfFov = this.fov / 2;
    const tanHalfFov = Math.tan(halfFov);
    const screenHalf = this.screenWidth / 2;
    const screenMid = this.screenHeight / 2;

    // 스프라이트를 거리 기준 정렬 (먼 것부터 그려 가까운 것이 위에 오도록)
    const projected = [];
    for (let s of this.sprites) {
      const dx = s.x - px;
      const dy = s.y - py;
      const distSq = dx*dx + dy*dy;
      if (distSq < 0.0001) continue;

      const dist = Math.sqrt(distSq);
      let ang = Math.atan2(dy, dx);
      let rel = ang - prot;
      while (rel < -Math.PI) rel += Math.PI*2;
      while (rel > Math.PI) rel -= Math.PI*2;

      // 시야 밖이면 스킵
      if (Math.abs(rel) > halfFov + 0.2) continue;

      const perpDist = dist * Math.cos(rel);
      if (perpDist <= 0.01) continue;

      // 화면 X 위치 계산 (rel이 음수면 왼쪽, 양수면 오른쪽)
      const screenX = screenHalf + (Math.tan(rel) / tanHalfFov) * screenHalf;
      const scale = this.viewDist / perpDist;
      
      projected.push({ sprite: s, perpDist, screenX, scale });
    }

    // 거리순 정렬 (먼 것부터)
    projected.sort((a, b) => b.perpDist - a.perpDist);

    // 렌더링: 픽셀별 오클루전 체크 + 성능 최적화
    push();
    noStroke();
    
    for (let p of projected) {
      const s = p.sprite;
      
      // 방향별 이미지 선택 (앞/뒤/좌/우)
      const img = this._getSpriteDirectionalImage(s);
      if (!img || !img.width) continue;

      const spriteH = (this.textureSize || 64) * p.scale;
      const spriteW = (img.width / Math.max(1, img.height)) * spriteH;
      const drawX = p.screenX - spriteW/2;
      const drawY = screenMid - spriteH/2;

      // 화면 밖 완전히 벗어난 스프라이트는 스킵
      if (drawX + spriteW < 0 || drawX >= this.screenWidth) continue;

      const startX = Math.max(0, Math.floor(drawX));
      const endX = Math.min(this.screenWidth, Math.ceil(drawX + spriteW));
      
      // 성능 최적화: 가까울수록(큰 스프라이트) 샘플링 간격 증가
      // perpDist < 2: 매우 가까움 (4픽셀 간격), < 5: 가까움 (2픽셀), 그 외: 1픽셀
      const sampleStep = p.perpDist < 2 ? Math.max(4, this.stripWidth) : 
                         p.perpDist < 5 ? Math.max(2, this.stripWidth) : 
                         this.stripWidth;
      
      // 스트립별로 벽 깊이 체크하며 그리기
      for (let sx = startX; sx < endX; sx += sampleStep) {
        const stripIdx = Math.floor(sx / this.stripWidth);
        const wallInfo = this.screenLines[stripIdx];
        
        // 벽이 스프라이트보다 가까우면 해당 스트립 스킵
        if (wallInfo && wallInfo.dist < p.perpDist) continue;

        const localX = sx - drawX;
        const srcX = (localX / spriteW) * img.width;
        const drawWidth = Math.min(sampleStep, endX - sx);
        const srcWidth = (drawWidth / spriteW) * img.width;
        
        image(img, sx, drawY, drawWidth, spriteH, srcX, 0, srcWidth, img.height);
      }
    }
    
    pop();
  }
}

window.FullEngine = FullEngine;