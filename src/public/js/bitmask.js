// ============================================================================
// DEMO CÁC PHÉP TOÁN BITMASK ĐẶT VÉ TÀU
// ============================================================================

const STATIONS = [
    { id: 0, name: "Hà Nội", code: "HAN" },
    { id: 1, name: "Phủ Lý", code: "PLY" },
    { id: 2, name: "Ninh Bình", code: "NBI" },
    { id: 3, name: "Thanh Hóa", code: "THA" },
    { id: 4, name: "Vinh", code: "VII" }
];

const SEG_LABELS = [
    "Chặng 0: Hà Nội - Phủ Lý",
    "Chặng 1: Phủ Lý - Ninh Bình",
    "Chặng 2: Ninh Bình - Thanh Hóa",
    "Chặng 3: Thanh Hóa - Vinh"
];

const TOTAL_SEGMENTS = 4;
const FULL_MASK = 15; // 0b1111 (4 bit tương ứng 4 chặng)

function toBin(n, bits = 4) {
    return (n >>> 0).toString(2).padStart(bits, "0");
}

function toHex(n) {
    return "0x" + (n >>> 0).toString(16).toUpperCase().padStart(2, "0");
}

function buildSegmentMask(fromIndex, toIndex) {
    const count = toIndex - fromIndex;
    if (count <= 0) return 0;
    return ((1 << count) - 1) << fromIndex;
}

function hasConflict(mask1, mask2) {
    return (mask1 & mask2) !== 0;
}

function buildClearMask(segmentMask) {
    return FULL_MASK ^ segmentMask;
}

// ============================================================================
// HIỂN THỊ 4 Ô BIT TRỰC QUAN
// ============================================================================
function renderRegisterBits(container, mask, conflictMask = null, activeLane = -1) {
    let html = "";
    for (let i = 3; i >= 0; i--) {
        const bitVal = (mask >> i) & 1;
        const isConflict = conflictMask !== null && ((conflictMask >> i) & 1);
        const isCurrentActive = activeLane === i;

        let borderClass = "border-slate-800 bg-slate-900 text-slate-400";
        let statusText = "0 (Trống)";
        let badgeColor = "text-slate-500 bg-slate-800";

        if (isConflict) {
            borderClass = "border-rose-500 bg-rose-950/40 text-rose-300 ring-1 ring-rose-500";
            statusText = "Trùng!";
            badgeColor = "text-rose-300 bg-rose-950 border border-rose-800";
        } else if (bitVal === 1) {
            borderClass = "border-emerald-500 bg-emerald-950/30 text-emerald-300";
            statusText = "1 (Có người)";
            badgeColor = "text-emerald-300 bg-emerald-950 border border-emerald-800";
        }

        if (isCurrentActive) {
            borderClass += " ring-2 ring-cyan-400 scale-105";
        }

        const segFrom = STATIONS[i] ? STATIONS[i].name : `Ga ${i}`;
        const segTo = STATIONS[i + 1] ? STATIONS[i + 1].name : `Ga ${i + 1}`;

        html += `
            <div id="${typeof container === 'string' ? container : 'reg'}_bit_${i}" 
                 class="relative flex flex-col items-center justify-between p-3 rounded-lg border ${borderClass} transition-all duration-200">
                <div class="w-full flex items-center justify-between text-xs font-mono">
                    <span class="text-slate-400 font-bold">Bit ${i}</span>
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold ${badgeColor}">${statusText}</span>
                </div>
                <div class="my-2 text-3xl font-mono font-extrabold">
                    ${bitVal}
                </div>
                <div class="w-full text-center border-t border-slate-800/80 pt-1.5">
                    <div class="text-[11px] font-medium text-slate-200 truncate">${segFrom} &rarr; ${segTo}</div>
                </div>
            </div>
        `;
    }

    const target = typeof container === "string" ? document.getElementById(container) : container;
    if (target) {
        target.innerHTML = html;
    }
}

// ============================================================================
// TAB 1: TẠO MẶT NẠ CHẶNG
// ============================================================================
function updateMask() {
    const fromEl = document.getElementById("fromIdx");
    const toEl = document.getElementById("toIdx");
    const stepsEl = document.getElementById("formulaSteps");
    const regValueEl = document.getElementById("regSummaryValue");
    if (!fromEl || !toEl || !stepsEl) return;

    const from = parseInt(fromEl.value, 10);
    const to = parseInt(toEl.value, 10);

    if (from >= to) {
        stepsEl.innerHTML = `
            <div class="p-3 rounded-lg bg-rose-950/30 border border-rose-800 text-rose-300 text-xs">
                Ga xuất phát phải đi trước ga đến. Vui lòng chọn lại.
            </div>
        `;
        renderRegisterBits("bitDisplay", 0);
        if (regValueEl) regValueEl.innerText = "0b0000 (Số 0)";
        return;
    }

    const count = to - from;
    const ones = (1 << count) - 1;
    const mask = ones << from;

    renderRegisterBits("bitDisplay", mask);

    if (regValueEl) {
        regValueEl.innerHTML = `
            <span class="text-emerald-400 font-bold">0b${toBin(mask)}</span>
            <span class="text-slate-500">|</span>
            <span class="text-slate-200">Số thập phân: <strong>${mask}</strong></span>
        `;
    }

    stepsEl.innerHTML = `
        <div class="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs leading-relaxed text-slate-300 space-y-1">
            <div>&bull; Đi từ <strong>${STATIONS[from].name}</strong> đến <strong>${STATIONS[to].name}</strong> gồm <strong>${count} chặng liên tiếp</strong>.</div>
            <div>&bull; Bật <strong>${count} bit 1</strong> bắt đầu từ vị trí bit <strong>${from}</strong>.</div>
            <div>&bull; Kết quả chuỗi bit: <strong class="text-cyan-400 font-mono">0b${toBin(mask)}</strong> (lưu trong cơ sở dữ liệu dưới dạng số nguyên: <strong class="text-emerald-400 font-mono">${mask}</strong>).</div>
        </div>
    `;

    updateRouteHighlight(from, to);
}

function updateRouteHighlight(from, to) {
    for (let i = 0; i < 4; i++) {
        const segEl = document.getElementById(`routeSeg${i}`);
        if (segEl) {
            if (i >= from && i < to) {
                segEl.className = "segment-line h-1 flex-1 bg-cyan-400 transition-all duration-300";
            } else {
                segEl.className = "segment-line h-1 flex-1 bg-slate-800 transition-all duration-300";
            }
        }
    }
}

// ============================================================================
// TAB 2: KIỂM TRA TRÙNG GHẾ (PHÉP AND) + ANIMATION KIỂM TRA TỪNG BIT
// ============================================================================
let isAluClockRunning = false;

function updateConflict() {
    const oFromEl = document.getElementById("occupiedFrom");
    const oToEl = document.getElementById("occupiedTo");
    const rFromEl = document.getElementById("requestFrom");
    const rToEl = document.getElementById("requestTo");
    const resultEl = document.getElementById("conflictResult");
    const formulaEl = document.getElementById("conflictFormula");

    if (!oFromEl || !oToEl || !rFromEl || !rToEl || !resultEl || !formulaEl) return;

    const oFrom = parseInt(oFromEl.value, 10);
    const oTo = parseInt(oToEl.value, 10);
    const rFrom = parseInt(rFromEl.value, 10);
    const rTo = parseInt(rToEl.value, 10);

    if (oFrom >= oTo || rFrom >= rTo) {
        resultEl.innerHTML = `
            <div class="p-3 rounded-lg bg-rose-950/30 border border-rose-800 text-rose-300 text-xs">
                Ga xuất phát phải đi trước ga đến.
            </div>
        `;
        return;
    }

    const occupied = buildSegmentMask(oFrom, oTo);
    const requested = buildSegmentMask(rFrom, rTo);
    const andResult = occupied & requested;
    const isConflict = andResult !== 0;

    renderRegisterBits("conflictBitsA", occupied);
    renderRegisterBits("conflictBitsB", requested, isConflict ? andResult : null);

    formulaEl.innerHTML = `
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <span class="text-slate-300 font-bold">Phép toán kiểm tra: (Khách A &amp; Khách B) &ne; 0</span>
                <span class="px-2.5 py-0.5 rounded font-mono font-bold text-xs ${isConflict ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}">
                    ${isConflict ? 'KẾT QUẢ: TRÙNG CHẶNG' : 'KẾT QUẢ: HỢP LỆ (KHÔNG TRÙNG)'}
                </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                <div class="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <div class="text-slate-400 text-[11px]">Khách A (Đã đặt):</div>
                    <div class="text-slate-200 font-bold mt-1 text-sm">0b${toBin(occupied)} (${occupied})</div>
                </div>

                <div class="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <div class="text-slate-400 text-[11px]">Khách B (Muốn mua):</div>
                    <div class="text-slate-200 font-bold mt-1 text-sm">0b${toBin(requested)} (${requested})</div>
                </div>

                <div class="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <div class="text-slate-400 text-[11px]">Kết quả phép AND (&amp;):</div>
                    <div class="${isConflict ? 'text-rose-400' : 'text-emerald-400'} font-bold mt-1 text-sm">
                        0b${toBin(andResult)} (${andResult})
                    </div>
                </div>
            </div>

            <div class="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
                <div class="text-slate-400">
                    Nguyên lý: Nếu cả 2 cùng có bit 1 tại một vị trí &rarr; Kết quả AND &gt; 0 &rarr; Bị trùng chỗ.
                </div>
                <button type="button" 
                        id="runAluPulseBtn" 
                        onclick="animateAluClockCycle(${occupied}, ${requested})"
                        class="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5">
                    <span>&#9654;</span> Bấm để xem kiểm tra từng bit (Animation)
                </button>
            </div>

            <!-- Khung diễn giải từng bit chạy động -->
            <div id="aluClockTracePanel" class="hidden p-3 rounded bg-slate-950 border border-slate-800 text-xs space-y-1 font-mono"></div>
        </div>
    `;

    if (isConflict) {
        const conflictSegments = [];
        for (let i = 0; i < 4; i++) {
            if ((andResult >> i) & 1) conflictSegments.push(SEG_LABELS[i]);
        }
        resultEl.innerHTML = `
            <div class="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                <div class="font-bold uppercase text-rose-200">Không thể đặt vé (Trùng ghế)</div>
                <div class="mt-1 text-slate-300">
                    Bị trùng ở đoạn: <strong class="text-rose-300">${conflictSegments.join(", ")}</strong>. Khách B phải chọn ghế khác.
                </div>
            </div>
        `;
    } else {
        const newMask = occupied | requested;
        resultEl.innerHTML = `
            <div class="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs">
                <div class="font-bold uppercase text-emerald-200">Đặt vé thành công!</div>
                <div class="mt-1 text-slate-300">
                    Hai khách đi 2 chặng hoàn toàn khác nhau, cùng ngồi chung 1 ghế bình thường.
                </div>
                <div class="mt-1 text-cyan-300 font-mono text-[11px]">
                    Ghế sau khi gộp 2 khách: 0b${toBin(occupied)} | 0b${toBin(requested)} = 0b${toBin(newMask)} (Số ${newMask})
                </div>
            </div>
        `;
    }
}

// ============================================================================
// ANIMATION: KIỂM TRA TỪNG BIT ĐỂ THẦY CÔ VÀ BẠN BÈ DỄ HIỂU
// ============================================================================
async function animateAluClockCycle(occupied, requested) {
    if (isAluClockRunning) return;
    isAluClockRunning = true;

    const btn = document.getElementById("runAluPulseBtn");
    const tracePanel = document.getElementById("aluClockTracePanel");
    if (btn) {
        btn.disabled = true;
        btn.innerText = "Đang kiểm tra từng bit...";
    }
    if (tracePanel) {
        tracePanel.classList.remove("hidden");
        tracePanel.innerHTML = `<div class="text-cyan-400 font-bold">// Bắt đầu so sánh 4 bit từ b0 đến b3:</div>`;
    }

    const andResult = occupied & requested;

    for (let lane = 0; lane < 4; lane++) {
        const bitA = (occupied >> lane) & 1;
        const bitB = (requested >> lane) & 1;
        const bitRes = (andResult >> lane) & 1;

        renderRegisterBits("conflictBitsA", occupied, null, lane);
        renderRegisterBits("conflictBitsB", requested, andResult !== 0 ? andResult : null, lane);

        if (tracePanel) {
            const laneStatus = bitRes === 1 
                ? `<span class="text-rose-400 font-bold">1 & 1 = 1 &rarr; TRÙNG NHAU Ở ${SEG_LABELS[lane]}!</span>`
                : `<span class="text-emerald-400 font-bold">${bitA} & ${bitB} = 0 &rarr; Không trùng</span>`;
            
            tracePanel.innerHTML += `
                <div class="pl-2 border-l-2 ${bitRes === 1 ? 'border-rose-500 text-rose-300' : 'border-emerald-500 text-slate-300'}">
                    Bit ${lane}: Khách A = <strong>${bitA}</strong>, Khách B = <strong>${bitB}</strong> &rarr; ${laneStatus}
                </div>
            `;
        }

        await new Promise(r => setTimeout(r, 600));
    }

    renderRegisterBits("conflictBitsA", occupied, null, -1);
    renderRegisterBits("conflictBitsB", requested, andResult !== 0 ? andResult : null, -1);

    if (tracePanel) {
        const finalStatus = andResult === 0
            ? `<span class="text-emerald-400 font-bold">XONG: Tất cả các bit đều không trùng nhau &rarr; ĐẶT VÉ HỢP LỆ!</span>`
            : `<span class="text-rose-400 font-bold">XONG: Có bit bị trùng &rarr; TỪ CHỐI ĐẶT VÉ!</span>`;
        tracePanel.innerHTML += `<div class="mt-2 pt-2 border-t border-slate-800">${finalStatus}</div>`;
    }

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span>&#9654;</span> Bấm để chạy lại kiểm tra`;
    }
    isAluClockRunning = false;
}

// ============================================================================
// TAB 3: TRẢ VÉ / HỦY CHẶNG BẰNG PHÉP XOR
// ============================================================================
function updateCancel() {
    const occEl = document.getElementById("cancelOccupied");
    const segEl = document.getElementById("cancelSegment");
    const vizEl = document.getElementById("cancelViz");
    if (!occEl || !segEl || !vizEl) return;

    const occupied = parseInt(occEl.value, 10);
    const segment = parseInt(segEl.value, 10);
    const clearMask = buildClearMask(segment);
    const result = occupied & clearMask;

    vizEl.innerHTML = `
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
            <div class="text-slate-300 font-bold">Cách giải phóng chặng: Dùng XOR để tạo mặt nạ xóa, sau đó AND với ghế</div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 font-mono">
                <div class="p-3 rounded bg-slate-950 border border-slate-800">
                    <div class="text-slate-400 text-[11px]">Bước 1: Đảo bit chặng cần hủy (phép XOR ^)</div>
                    <div class="text-cyan-400 font-bold mt-1">
                        0b1111 ^ 0b${toBin(segment)} = <span class="text-amber-400">0b${toBin(clearMask)}</span>
                    </div>
                    <div class="text-[11px] text-slate-500 mt-1">Đổi bit của chặng muốn hủy thành 0.</div>
                </div>

                <div class="p-3 rounded bg-slate-950 border border-slate-800">
                    <div class="text-slate-400 text-[11px]">Bước 2: Xóa chặng khỏi ghế (phép AND &amp;)</div>
                    <div class="text-emerald-400 font-bold mt-1">
                        0b${toBin(occupied)} &amp; 0b${toBin(clearMask)} = <span class="text-emerald-300">0b${toBin(result)}</span>
                    </div>
                    <div class="text-[11px] text-slate-500 mt-1">Chỉ xóa đúng chặng đó, các chặng khác giữ nguyên.</div>
                </div>
            </div>

            <div class="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
                <span class="text-slate-300">Trạng thái ghế sau khi hủy:</span>
                <span class="text-emerald-400 font-mono font-bold">0b${toBin(result)} (Số: ${result})</span>
            </div>
        </div>
    `;

    renderRegisterBits("cancelBitsResult", result);
}
