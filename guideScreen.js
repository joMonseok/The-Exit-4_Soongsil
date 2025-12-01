function guideScreen() {
  // 배경
  background(8, 8, 10);

  const cx = width  * 0.5;
  const cy = height * 0.5;

  // 패널 크기 (비율 기반)
  const panelW = width  *1;
  const panelH = height * 1;

  // 공통 스케일 (글자 크기, 간격 등)
  const base = min(width, height);
  const padding   = base * 0.08;  // 패널 안쪽 여백
  const lineGap   = base * 0.05; // 줄 간격
  const titleSize = base * 0.05;
  const sectionSize = base * 0.022;
  const textSizeN  = base * 0.04;
  const textSizeSmall = base * 0.03;

  push();
  rectMode(CENTER);
  noStroke();

  // 반투명 패널
  fill(15, 18, 22, 230);
  rect(cx, cy, panelW, panelH, base * 0.02);

  const left = cx - panelW / 2 + padding;
  const top  = cy - panelH / 2 + padding;

  // 제목
  fill(240);
  textAlign(LEFT, TOP);

  textStyle(BOLD);
  textSize(titleSize);
  text("사용 가이드", left, top);

  let y = top + lineGap * 1.8;

  // 조작법 섹션
  textStyle(BOLD);
  textSize(sectionSize);
  text("조작법", left, y);
  y += lineGap * 1.2;

  textStyle(NORMAL);
  textSize(textSizeN);
  text("↑  : 앞으로 이동",       left, y); y += lineGap;
  text("↓  : 뒤로 이동",         left, y); y += lineGap;
  text("←  : 왼쪽으로 회전",     left, y); y += lineGap;
  text("→  : 오른쪽으로 회전",   left, y); y += lineGap * 1.6;

  // 규칙 섹션
  textStyle(BOLD);
  textSize(sectionSize);
  text("규칙", left, y);
  y += lineGap * 1.2;

  textStyle(NORMAL);
  textSize(textSizeN);
  text("· 이상현상이 나타나면 뒤로 돌아가세요.",       left, y); y += lineGap;
  text("· 이상현상이 보이지 않으면 앞으로 나아가세요.", left, y); y += lineGap;

  textSize(textSizeSmall);
  text("(힌트: 액자, 사람의 행동, 문을 유심히 관찰해보세요.)", left, y);
  y += lineGap * 1.8;

  // 마지막 문구
  textStyle(BOLD);
  textSize(textSizeN);
  text("끊임없는 이 미로에서 탈출해보세요. 🙏", left, y);

  pop();

  // 닫기
  drawGuideCloseButton();
}

function drawGuideCloseButton() {
  const base = min(width, height);
  const margin = base * 0.03;
  const size   = base * 0.045; // 버튼 한 변

  const x = width  - margin - size / 2;
  const y = margin + size / 2;

  push();

  rectMode(CENTER);
  stroke(220);
  strokeWeight(2);
  fill(20, 20, 24, 230);
  rect(x, y, size, size, base * 0.01);

  // X 표시
  const inner = size * 0.4;
  stroke(240);
  strokeWeight(2);
  line(x - inner, y - inner, x + inner, y + inner);
  line(x - inner, y + inner, x + inner, y - inner);

  pop();
}

function isGuideCloseButtonClicked(mx, my) {
  const base = min(width, height);
  const margin = base * 0.03;
  const size   = base * 0.045;

  const x = width  - margin - size / 2;
  const y = margin + size / 2;

  // 단순 박스 히트 테스트
  return (
    mx >= x - size / 2 &&
    mx <= x + size / 2 &&
    my >= y - size / 2 &&
    my <= y + size / 2
  );
}