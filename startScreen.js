function startScreen() {
  const t = millis() / 1000;

  // 팔레트
  const BG   = color(8, 8, 10);
  const LINE = color(67, 72, 42);
  const GLOW = color(180, 190, 170, 220);

  // === 배경 ===
  push();
  background(BG);
  pop();

  // === 표지판 본체 (비율 스케일) ===
  const cx = width / 2;
  const cy = height * 0.5;
  const barW = width;
  const barH = min(110, height * 0.3);
  const flicker = constrain(noise(t * 4.0) * 1.2 - 0.1, 0, 1);

  // 메인 바
  push();
  rectMode(CENTER);
  noStroke();
  fill(red(LINE), green(LINE), blue(LINE), 220 + 25 * flicker);
  rect(cx, cy, barW, barH);
  pop();

  // 예: 좌측 가장자리에서 1.2배 크기로 흰색 표시
// 남성: 왼쪽 가장자리 근처
drawLeftStationCue(0, height * 0.5, 0.6, color(255));

// 상도: 오른쪽 가장자리 근처
drawRightStationCue(width, height * 0.5, 0.6, color(255));



  // === 텍스트 (외곽 강조: 다중 드로우) ===
  const baseK = barH / 100;
  const titleSize = 50 * baseK;
  const jitterAmt = (1.2 + flicker * 0.6) * baseK;
  const jx = random(-jitterAmt, jitterAmt);
  const jy = random(-jitterAmt, jitterAmt);

  // 공통 텍스트 상태
  push();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);

//   // 2) 초록 잔상
  fill(170, 200, 150, 90);
  textSize(titleSize);
  text("숭실대입구", cx + jx + 2, cy - barH * 0.08 + jy);

  // 3) 본문 흰색 (가장 위)
  fill(255);
  textSize(titleSize);
  text("숭실대입구", cx + jx, cy - barH * 0.10 + jy);


  // === 스캔라인 ===
  push();
  noStroke();
  for (let y = 0; y < height; y += 3) {
    fill(0, 15);
    rect(0, y, width, 1);
  }
  pop();

  // === 시작 안내 (숨쉬기 + 글리치) ===
  const breath = (sin(t * 2.2) + 1) * 0.5;
  const alpha  = 110 + breath * 100;
  const glitch = (noise(t * 1.7) - 0.5) * 6;

  push();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  fill(200, alpha);
  textSize(24 * baseK);
  text("Press ENTER to start", width / 2 + glitch, height * 0.82);
  pop();
}

// 좌측 역 안내 묶음 (화살표 + 3줄 텍스트)
// x, y : 화살표 '끝(뾰족한 끝)'의 중심 위치
// s    : 크기 배율(1이 기본)
// col  : 화살표/텍스트 색상
// labelKo/En/Han : 표기 커스텀 가능
// 남성: ← 화살표가 텍스트의 왼쪽(글은 오른쪽에 정렬 X, 왼쪽 정렬 O)
function drawLeftStationCue(
  x, y, s = 1, col = color(255),
  { labelKo = "남 성", labelEn = "Namseong", labelHan = "南城" } = {}
) {
  push();
  noStroke();
  fill(col);

  // 좌향 화살표 치수
  const headW  = 28 * s;   // 화살촉 길이
  const shaftW = 44 * s;   // 몸통 길이
  const arrowH = 32 * s;   // 전체 높이
  const shaftH = arrowH * 0.44;

  // *** 좌향(←)으로 수정: tip이 x,y 이고 몸통은 x보다 오른쪽에 위치 ***
  beginShape();
  vertex(x + (headW + shaftW), y - shaftH / 2); // 몸통 오른
  vertex(x + headW,            y - shaftH / 2); // 몸통 왼(촉 시작)
  vertex(x + headW,            y - arrowH / 2); // 윗선
  vertex(x,                    y);              // 뾰족 끝(왼쪽)
  vertex(x + headW,            y + arrowH / 2); // 아랫선
  vertex(x + headW,            y + shaftH / 2); // 몸통 하단
  vertex(x + (headW + shaftW), y + shaftH / 2); // 몸통 오른
  endShape(CLOSE);

  // 텍스트: 화살표 오른쪽에 배치 (LEFT 정렬)
  const tx = x + (headW + shaftW) + 12 * s;
  textAlign(LEFT, CENTER);

  textStyle(BOLD);
  textSize(16 * s);
  text(labelKo, tx, y - 10 * s);

  textStyle(NORMAL);
  textSize(11 * s);
  text(labelEn, tx, y + 2 * s);

  textSize(10 * s);
  text(labelHan, tx, y + 14 * s);

  pop();
}

// 상도: 텍스트가 왼쪽, → 화살표가 텍스트 오른쪽 (기존 로직 유지, 한자 공백 제거)
function drawRightStationCue(
  x, y, s = 1, col = color(255),
  { labelKo = "상 도", labelEn = "Sangdo", labelHan = "上道" } = {}
) {
  push();
  noStroke();
  fill(col);

  const headW  = 28 * s;
  const shaftW = 44 * s;
  const arrowH = 32 * s;
  const shaftH = arrowH * 0.44;

  // 우향(→) 화살표: tip이 x,y, 몸통은 x보다 왼쪽
  beginShape();
  vertex(x - (headW + shaftW), y - shaftH / 2);
  vertex(x - headW,            y - shaftH / 2);
  vertex(x - headW,            y - arrowH / 2);
  vertex(x,                    y);              // 뾰족 끝(오른쪽)
  vertex(x - headW,            y + arrowH / 2);
  vertex(x - headW,            y + shaftH / 2);
  vertex(x - (headW + shaftW), y + shaftH / 2);
  endShape(CLOSE);

  // 텍스트: 화살표 왼쪽에 배치 (RIGHT 정렬)
  const tx = x - (headW + shaftW) - 12 * s;
  textAlign(RIGHT, CENTER);

  textStyle(BOLD);
  textSize(16 * s);
  text(labelKo, tx, y - 10 * s);

  textStyle(NORMAL);
  textSize(11 * s);
  text(labelEn, tx, y + 2 * s);

  textSize(10 * s);
  text(labelHan, tx, y + 14 * s);

  pop();
}