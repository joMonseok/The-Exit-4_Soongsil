/* ==========================================================
   End Screen (계단 + 문장 순차 페이드인 + 버튼 + 콜백)
   ========================================================== */

// -----------------------------
// 텍스트 + 상태
// -----------------------------
const END_TEXTS = [
  "휴… 겨우 빠져나왔다.",
  "아까 그 생각… 다시는 하지 말아야지.",
  "이런 곳에 또 갇히고 싶진 않아."
];

const endState = {
  alphas: END_TEXTS.map(() => 0),
  started: false,
  startTime: 0,
  isAllDone: false,
  showButton: false,
  buttonAlpha: 0
};

const END_BUTTON = { w: 160, h: 20 };

// 애니메이션 타이밍(ms)
const SENTENCE_FADE_DURATION = 700;
const SENTENCE_GAP = 400;
const END_BUTTON_FADE_SPEED = 10;

// -------------------------------------------------------
// 외부에서 호출하는 초기화 함수
// -------------------------------------------------------
function resetEndScreen() {
  endState.alphas = END_TEXTS.map(() => 0);
  endState.started = false;
  endState.startTime = 0;
  endState.isAllDone = false;
  endState.showButton = false;
  endState.buttonAlpha = 0;
}

// -------------------------------------------------------
// 메인: EndScreen UI 그리기
// onRestart: 버튼 클릭 시 실행되는 콜백
// -------------------------------------------------------
function endScreen(onRestart) {
  drawStairBackground();

  // 전체 딤
  push();
  noStroke();
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);
  pop();

  // 상단 타이틀
  push();
  fill(240);
  textSize(14);
  textAlign(CENTER, TOP);
  text("탈출 성공", width / 2, height * 0.06);
  pop();

  // 문장 페이드인
  handleEndFadeIn();

  // 텍스트 중앙 정렬
  const lineHeight = 26;
  const totalLines = END_TEXTS.length;
  const centerY = height * 0.5;
  const firstLineY = centerY - ((totalLines - 1) * lineHeight) / 2;

  push();
  textAlign(CENTER, CENTER);
  textSize(10);
  textLeading(lineHeight);
  for (let i = 0; i < END_TEXTS.length; i++) {
    const alpha = endState.alphas[i];
    if (alpha <= 0) continue;

    fill(235, alpha);
    const y = firstLineY + i * lineHeight;
    text(END_TEXTS[i], width / 2, y);
  }
  pop();

  // 버튼
  if (endState.showButton) {
    drawEndButton(onRestart);
  }
}

// -------------------------------------------------------
// 계단 배경 (Full screen)
// -------------------------------------------------------
function drawStairBackground() {
  background(20);

  const steps = 14;
  const bottomY = height * 0.98;
  const topY = height * 0.15;
  const bottomLeft = width * 0.05;
  const bottomRight = width * 0.95;
  const topLeft = width * 0.25;
  const topRight = width * 0.75;

  // 벽
  push();
  noStroke();
  fill(150, 210, 220);
  quad(0, 0, topLeft, topY, bottomLeft, bottomY, 0, height);
  quad(topRight, topY, width, 0, width, height, bottomRight, bottomY);
  pop();

  // 계단
  for (let i = 0; i < steps; i++) {
    const t1 = i / steps;
    const t2 = (i + 1) / steps;

    const y1 = lerp(bottomY, topY, t1);
    const y2 = lerp(bottomY, topY, t2);
    const l1 = lerp(bottomLeft, topLeft, t1);
    const r1 = lerp(bottomRight, topRight, t1);
    const l2 = lerp(bottomLeft, topLeft, t2);
    const r2 = lerp(bottomRight, topRight, t2);

    const shade = lerp(40, 90, t2);

    // 계단 면
    push();
    noStroke();
    fill(shade);
    quad(l1, y1, r1, y1, r2, y2, l2, y2);
    pop();

    // 모서리 라인
    push();
    stroke(shade + 40);
    strokeWeight(2);
    line(l2, y2, r2, y2);
    pop();
  }

  // 난간
  push();
  stroke(235);
  strokeWeight(4);
  line(
    lerp(bottomLeft, topLeft, 0.15), lerp(bottomY, topY, 0.15),
    lerp(bottomLeft, topLeft, 0.95), lerp(bottomY, topY, -0.05)
  );
  line(
    lerp(bottomRight, topRight, 0.15), lerp(bottomY, topY, 0.15),
    lerp(bottomRight, topRight, 0.95), lerp(bottomY, topY, -0.05)
  );
  pop();
}

// -------------------------------------------------------
// 문장 단위 fade-in 애니메이션
// -------------------------------------------------------
function handleEndFadeIn() {
  if (!endState.started) {
    endState.started = true;
    endState.startTime = millis();
  }

  const now = millis();
  const elapsed = now - endState.startTime;

  const windowPerSentence = SENTENCE_FADE_DURATION + SENTENCE_GAP;
  const lastSentenceStart = (END_TEXTS.length - 1) * windowPerSentence;

  for (let i = 0; i < END_TEXTS.length; i++) {
    const sentenceStart = i * windowPerSentence;
    const t = elapsed - sentenceStart;

    let alpha = 0;

    if (t <= 0) {
      alpha = 0;
    } else if (t >= SENTENCE_FADE_DURATION) {
      alpha = 255;
    } else {
      alpha = map(t, 0, SENTENCE_FADE_DURATION, 0, 255);
    }

    endState.alphas[i] = constrain(alpha, 0, 255);
  }

  // 모든 문장이 완전히 뜨면 버튼 등장
  if (elapsed >= lastSentenceStart + SENTENCE_FADE_DURATION) {
    endState.isAllDone = true;
  }

  if (endState.isAllDone) {
    endState.buttonAlpha = min(255, endState.buttonAlpha + END_BUTTON_FADE_SPEED);
    endState.showButton = true;
  }
}

// -------------------------------------------------------
// 버튼 렌더링 + 클릭 시 콜백 호출
// -------------------------------------------------------
function drawEndButton(onRestart) {
  const x = width / 2;
  const y = height * 0.82;
  const w = END_BUTTON.w;
  const h = END_BUTTON.h;

  const hover = mouseX >= x - w/2 &&
                mouseX <= x + w/2 &&
                mouseY >= y - h/2 &&
                mouseY <= y + h/2;

  push();
  rectMode(CENTER);
  noStroke();
  fill(255, endState.buttonAlpha);
  rect(x, y, w, h, 10);

  if (hover) {
    push();
    translate(x, y);
    scale(1.03);
    noFill();
    stroke(0, endState.buttonAlpha);
    strokeWeight(2);
    rect(0, 0, w, h, 10);
    pop();
  }

  fill(0, endState.buttonAlpha);
  textAlign(CENTER, CENTER);
  textSize(8);
  text("다시 도전하기", x, y);
  pop();
}

// -------------------------------------------------------
// "다시 도전하기" 버튼이 눌렸는지 여부만 판단
// -------------------------------------------------------
function isEndRetryButtonClicked() {
  // 버튼이 아직 안 보이거나 충분히 안 나타났으면 false
  if (!endState.showButton || endState.buttonAlpha < 250) {
    return false;
  }

  const x = width / 2;
  const y = height * 0.82;
  const w = END_BUTTON.w;
  const h = END_BUTTON.h;

  const inside =
    mouseX >= x - w / 2 &&
    mouseX <= x + w / 2 &&
    mouseY >= y - h / 2 &&
    mouseY <= y + h / 2;

  return inside;
}
