// Vertical layout: Punch Card (top) → Woven Swatch (bottom)
// + Repeat button to duplicate current punch-card pattern to the right.

let cols = 32, rows = 16;    // grid size
let gap = 32;                // vertical gap between punch and weave panels
let bits = [];               // 2D array [rows][cols]
let cell, canvasW, canvasH;  // computed dimensions

function setup(){
  const wrap = document.getElementById('canvasWrap');

  // compute initial size and create canvas
  const { w, h, c } = computeSize();
  canvasW = w; canvasH = h; cell = c;

  const cnv = createCanvas(canvasW, canvasH);
  cnv.parent(wrap);
  noStroke();
  textFont('ui-monospace, Menlo, Consolas, monospace');

  // init bits
  bits = Array.from({length: rows}, ()=>Array(cols).fill(0));

  // controls
  const textIn = document.getElementById('textIn');
  textIn.addEventListener('keydown', e => { if(e.key==='Enter'){ encodeText(e.target.value || ''); }});
  document.getElementById('presetAda').onclick   = ()=>encodeText('ADA');
  document.getElementById('presetAGC').onclick   = ()=>encodeText('AGC');
  document.getElementById('clearBtn').onclick    = ()=>bits.forEach(r=>r.fill(0));
  document.getElementById('repeatBtn').onclick   = repeatPatternToRight;
}

function draw(){
  background(255);
  // punch card on top
  drawPunchCard(0, 0);
  // woven swatch below
  drawWeave(0, rows*cell + gap);
  drawHUD();
}

function windowResized(){
  const { w, h, c } = computeSize();
  canvasW = w; canvasH = h; cell = c;
  resizeCanvas(canvasW, canvasH);
}

// Canvas sizing for vertical layout
function computeSize(){
  // Use container width to set cell size
  const wrap = document.getElementById('canvasWrap');
  const wrapW = Math.max(320, wrap.clientWidth || window.innerWidth);

  // For a single-column layout, width is cols*cell
  const c = Math.floor(wrapW / cols);
  const cellSize = Math.max(14, Math.min(28, c)); // clamp for readability
  const w = cols * cellSize;
  const h = rows * cellSize   // punch card
          + gap
          + rows * cellSize;  // woven

  return { w, h, c: cellSize };
}

function drawPunchCard(x0,y0){
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const x = x0 + c*cell, y = y0 + r*cell;
      fill(245); rect(x,y,cell,cell,6);
      if(bits[r][c]){ fill(0); circle(x+cell/2, y+cell/2, cell*0.55); }
    }
  }
  // label
  fill('#0f766e'); textSize(14);
  text('Punch Card (click to toggle 0/1)', 8, 16);
}

function drawWeave(x0,y0){
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const x = x0 + c*cell, y = y0 + r*cell;
      fill(bits[r][c] ? 224 : 172);
      rect(x,y,cell,cell);
      // subtle thread accents
      fill(255);                 rect(x, y + cell*0.45, cell, cell*0.1, 2);
      fill(120,120,120,80);      rect(x + cell*0.45, y, cell*0.1, cell, 2);
    }
  }
  // label
  fill('#0f766e'); textSize(14);
  text('Woven Swatch (rendered from card)', 8, y0 + 16);
}

function drawHUD(){
  // nothing extra for now (labels are in each panel)
}

function mousePressed(){
  // Only toggle if pointer is inside the TOP grid (punch card)
  const punchH = rows * cell;
  const within = (mouseX >= 0 && mouseX < cols*cell && mouseY >= 0 && mouseY < punchH);
  if(within){
    const c = Math.floor(mouseX/cell), r = Math.floor(mouseY/cell);
    bits[r][c] ^= 1;
  }
}

function keyPressed(){
  if(key==='S'){ saveCanvas('weave','png'); }
  if(key==='J'){ saveJSON(bits,'punchcard.json'); }
}

// Encode text → columns starting at column 0 (top 8 rows)
function encodeText(txt){
  bits.forEach(row=>row.fill(0));
  const n = Math.min(cols, txt.length);
  for(let i=0;i<n;i++){
    const b = txt.charCodeAt(i).toString(2).padStart(8,'0');
    for(let r=0;r<8;r++){
      const bit = Number(b[7-r]);
      bits[r][i] = bit;
    }
  }
}

// Find the rightmost column that has any '1'
function findLastUsedCol(){
  for(let c = cols-1; c >= 0; c--){
    for(let r=0; r<rows; r++){
      if(bits[r][c] === 1) return c;
    }
  }
  return -1; // no dots
}

// Duplicate the current pattern (columns 0..lastUsed) to the right, once per click
function repeatPatternToRight(){
  const last = findLastUsedCol();
  if(last < 0) return; // nothing to repeat

  const srcLen = last + 1;             // number of columns to copy
  const start  = last + 1;             // paste immediately after current end
  if(start >= cols) return;            // no space left

  const space  = cols - start;         // columns remaining to the right
  const copyLen = Math.min(srcLen, space);

  for(let dc = 0; dc < copyLen; dc++){
    const dstCol = start + dc;
    const srcCol = dc;                  // copy from the leftmost portion
    for(let r=0; r<rows; r++){
      bits[r][dstCol] = bits[r][srcCol];
    }
  }
  // (Optional) You could scroll to keep the newest area in view; not needed here.
}
