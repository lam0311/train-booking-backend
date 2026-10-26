const STATIONS = [
    { id: 0, name: "Hà Nội", code: "HAN" },
    { id: 1, name: "Nam Định", code: "NDI" },
    { id: 2, name: "Vinh", code: "VII" },
    { id: 3, name: "Huế", code: "HUE" },
    { id: 4, name: "Đà Nẵng", code: "DAN" }
];

const SEG_LABELS = [
    "Chặng 0: Hà Nội - Nam Định",
    "Chặng 1: Nam Định - Vinh",
    "Chặng 2: Vinh - Huế",
    "Chặng 3: Huế - Đà Nẵng"
];

const TOTAL_SEGMENTS = 4;
const FULL_MASK = 15; // 0b1111

function toBin(n, bits = 4) {
    return (n >>> 0).toString(2).padStart(bits, "0");
}

function toHex(n) {
    return "0x" + n.toString(16).toUpperCase().padStart(2, "0");
}

function buildSegmentMask(fromIndex, toIndex) {
    const count = toIndex - fromIndex;
    return ((1 << count) - 1) << fromIndex;
}

function hasConflict(mask1, mask2) {
    return (mask1 & mask2) !== 0;
}

function buildClearMask(segmentMask) {
    return FULL_MASK ^ segmentMask;
}

function renderRegisterBits(container, mask, conflictMask = null) {
    let html = "";
    for (let i = 3; i >= 0; i--) {
        const bitVal = (mask >> i) & 1;
        const isConflict = conflictMask !== null && ((conflictMask >> i) & 1);

        let borderClass = "border-slate-700 bg-slate-900/80 text-slate-500";
        let statusBadge = "IDLE";
        let statusClass = "text-slate-500 bg-slate-800";

        if (isConflict) {
            borderClass = "border-rose-500 bg-rose-950/40 text-rose-400";
            statusBadge = "CONFLICT";
            statusClass = "text-rose-400 bg-rose-950/80 border border-rose-800";
        } else if (bitVal === 1) {
            borderClass = "border-emerald-500 bg-emerald-950/30 text-emerald-400";
            statusBadge = "ACTIVE";
            statusClass = "text-emerald-400 bg-emerald-950/80 border border-emerald-800";
        }

        html += `
            <div class="relative flex flex-col items-center justify-between p-3 rounded-lg border ${borderClass} transition-all duration-200">
                <div class="w-full flex items-center justify-between text-[10px] font-mono">
                    <span class="text-slate-400 font-bold">BIT ${i}</span>
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-semibold ${statusClass}">${statusBadge}</span>
                </div>
                <div class="my-2 text-3xl font-mono font-extrabold tracking-wider">
                    ${bitVal}
                </div>
                <div class="w-full text-center">
                    <div class="text-[10px] font-medium text-slate-300 truncate">${STATIONS[i].code} - ${STATIONS[i+1].code}</div>
                    <div class="text-[9px] font-mono text-slate-500 mt-0.5">2^${i} = ${1 << i}</div>
                </div>
            </div>
        `;
    }

    const target = typeof container === "string" ? document.getElementById(container) : container;
    if (target) {
        target.innerHTML = html;
    }
}

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
                Chỉ số ga xuất phát (fromIndex) phải nhỏ hơn chỉ số ga đến (toIndex).
            </div>
        `;
        renderRegisterBits("bitDisplay", 0);
        if (regValueEl) regValueEl.innerText = "0b0000 | 0x00 | DEC: 0";
        return;
    }

    const count = to - from;
    const ones = (1 << count) - 1;
    const mask = ones << from;

    renderRegisterBits("bitDisplay", mask);

    if (regValueEl) {
        regValueEl.innerHTML = `
            <span class="text-emerald-400">0b${toBin(mask)}</span>
            <span class="text-slate-500">|</span>
            <span class="text-cyan-400">${toHex(mask)}</span>
            <span class="text-slate-500">|</span>
            <span class="text-slate-300">DEC: ${mask}</span>
        `;
    }

    stepsEl.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div class="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div class="text-slate-400 text-[11px] mb-1 font-semibold text-cyan-400">BƯỚC 1: TÍNH ĐỘ DÀI PHÂN ĐOẠN</div>
                <div class="text-slate-300">segmentCount = toIndex - fromIndex</div>
                <div class="text-emerald-400 mt-1">${to} - ${from} = <span class="font-bold">${count}</span></div>
            </div>

            <div class="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div class="text-slate-400 text-[11px] mb-1 font-semibold text-cyan-400">BƯỚC 2: TẠO MẶT NẠ BIT 1</div>
                <div class="text-slate-300">onesMask = (1 &lt;&lt; ${count}) - 1</div>
                <div class="text-emerald-400 mt-1">${ones} (0b${toBin(ones)})</div>
            </div>

            <div class="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div class="text-slate-400 text-[11px] mb-1 font-semibold text-cyan-400">BƯỚC 3: DỊCH VỀ GA XUẤT PHÁT</div>
                <div class="text-slate-300">segmentMask = onesMask &lt;&lt; fromIndex</div>
                <div class="text-emerald-400 mt-1">${ones} &lt;&lt; ${from} = <span class="font-bold text-amber-400">${mask}</span> (0b${toBin(mask)})</div>
            </div>

            <div class="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div class="text-slate-400 text-[11px] mb-1 font-semibold text-cyan-400">BƯỚC 4: KẾT QUẢ MẶT NẠ CHẶNG</div>
                <div class="text-slate-300">resultMask = segmentMask</div>
                <div class="text-cyan-400 mt-1">Giá trị cuối: 0x${mask.toString(16).toUpperCase()}</div>
            </div>
        </div>
    `;

    updateRouteHighlight(from, to);
}

function updateRouteHighlight(from, to) {
    for (let i = 0; i < 4; i++) {
        const segEl = document.getElementById(`routeSeg${i}`);
        if (segEl) {
            if (i >= from && i < to) {
                segEl.className = "segment-line h-1 flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300";
            } else {
                segEl.className = "segment-line h-1 flex-1 bg-slate-800 transition-all duration-300";
            }
        }
    }
}

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
                Chỉ số ga xuất phát phải nhỏ hơn ga đến.
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
        <div class="p-4 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs space-y-2">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
                <span>PHÉP TOÁN KIỂM TRA ĐỒNG THỜI</span>
                <span class="text-cyan-400 font-bold">BITWISE AND (&)</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div class="p-2 rounded bg-slate-950 border border-slate-800">
                    <span class="text-slate-500">MẶT NẠ HIỆN HỮU:</span>
                    <div class="text-slate-200 font-bold mt-1">0b${toBin(occupied)} (${toHex(occupied)})</div>
                </div>
                <div class="p-2 rounded bg-slate-950 border border-slate-800">
                    <span class="text-slate-500">MẶT NẠ YÊU CẦU:</span>
                    <div class="text-slate-200 font-bold mt-1">0b${toBin(requested)} (${toHex(requested)})</div>
                </div>
                <div class="p-2 rounded bg-slate-950 border border-slate-800">
                    <span class="text-slate-500">KẾT QUẢ GIAO THOA:</span>
                    <div class="${isConflict ? 'text-rose-400' : 'text-emerald-400'} font-bold mt-1">0b${toBin(andResult)} (${toHex(andResult)})</div>
                </div>
            </div>
            <div class="text-[11px] text-slate-400 pt-1">
                Biểu thức: <code class="text-cyan-300">(occupiedMask & requestedMask) !== 0</code> → <span class="font-bold ${isConflict ? 'text-rose-400' : 'text-emerald-400'}">${isConflict ? 'TRUE (XUNG ĐỘT)' : 'FALSE (HỢP LỆ)'}</span>
            </div>
        </div>
    `;

    if (isConflict) {
        const conflictSegments = [];
        for (let i = 0; i < 4; i++) {
            if ((andResult >> i) & 1) conflictSegments.push(SEG_LABELS[i]);
        }
        resultEl.innerHTML = `
            <div class="p-3 rounded-lg bg-rose-950/40 border border-rose-700 text-rose-300 text-xs">
                <div class="font-bold uppercase">Từ chối: 409 SEGMENT_CONFLICT</div>
                <div class="mt-1 text-slate-400">
                    Trùng phân đoạn: <span class="font-mono text-rose-200 font-semibold">${conflictSegments.join(", ")}</span>.
                </div>
            </div>
        `;
    } else {
        const newMask = occupied | requested;
        resultEl.innerHTML = `
            <div class="p-3 rounded-lg bg-emerald-950/40 border border-emerald-700 text-emerald-300 text-xs">
                <div class="font-bold uppercase">Thành công: 201 CREATED</div>
                <div class="mt-1 text-slate-400">
                    Không có phân đoạn giao cắt. Cập nhật occupiedMask: 
                    <code class="font-mono text-cyan-300">0b${toBin(newMask)} (${toHex(newMask)})</code>.
                </div>
            </div>
        `;
    }
}

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
        <div class="p-4 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="p-3 rounded bg-slate-950 border border-slate-800">
                    <div class="text-slate-400 text-[10px]">BƯỚC 1: TẠO MẶT NẠ XÓA (XOR)</div>
                    <div class="text-slate-200 mt-1">clearMask = FULL_MASK ^ segmentMask</div>
                    <div class="text-cyan-400 font-bold mt-1">0b1111 ^ 0b${toBin(segment)} = <span class="text-amber-400">0b${toBin(clearMask)}</span> (${toHex(clearMask)})</div>
                </div>

                <div class="p-3 rounded bg-slate-950 border border-slate-800">
                    <div class="text-slate-400 text-[10px]">BƯỚC 2: CẬP NHẬT TRẠNG THÁI (AND)</div>
                    <div class="text-slate-200 mt-1">newMask = occupiedMask & clearMask</div>
                    <div class="text-emerald-400 font-bold mt-1">0b${toBin(occupied)} & 0b${toBin(clearMask)} = <span class="text-emerald-300">0b${toBin(result)}</span> (${toHex(result)})</div>
                </div>
            </div>

            <div class="p-2.5 rounded bg-slate-950 text-[11px] flex items-center justify-between">
                <span class="text-slate-400">Trạng thái sau giải phóng:</span>
                <span class="text-emerald-400 font-bold">0b${toBin(result)} | ${toHex(result)} | DEC: ${result}</span>
            </div>
        </div>
    `;

    renderRegisterBits("cancelBitsResult", result);
}
