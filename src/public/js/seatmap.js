// ============================================================================
// SƠ ĐỒ TOA TÀU & MÔ PHỎNG GIẢI PHÓNG GHẾ THEO TỪNG GA
// ============================================================================

const coachSeats = [];

const INITIAL_SEAT_MASKS = [
    0, 3, 0, 12, 0, 7, 15, 0, 2, 0,
    0, 6, 0, 1, 0, 14, 0, 0, 8, 0,
    3, 0, 0, 0, 15, 0, 8, 0, 4, 0,
    0, 5, 0, 12, 0, 0, 0, 3, 15, 10
];

let currentFilterFrom = 0;
let currentFilterTo = 2; // Hà Nội (0) -> Ninh Bình (2)
let isTrainMoving = false;

function initSeats() {
    coachSeats.length = 0;
    const cols = ["A", "B", "C", "D"];

    for (let i = 0; i < 40; i++) {
        const colIdx = Math.floor(i / 10);
        const rowNum = (i % 10) + 1;
        coachSeats.push({
            id: i + 1,
            seatCode: `${cols[colIdx]}${rowNum.toString().padStart(2, "0")}`,
            column: cols[colIdx],
            row: rowNum,
            occupiedMask: INITIAL_SEAT_MASKS[i] || 0
        });
    }

    renderModernCoach();
    updateCoachStats();
}

function resetCoachSeats() {
    coachSeats.forEach((seat, idx) => {
        seat.occupiedMask = INITIAL_SEAT_MASKS[idx] || 0;
    });
    updateTrainCarriagePosition(0);
    renderModernCoach();
    updateCoachStats();

    const statusMsg = document.getElementById("trainJourneyStatusMsg");
    if (statusMsg) {
        statusMsg.innerHTML = '<span class="text-slate-400 font-mono text-xs">// Đã đặt lại trạng thái 40 ghế về ban đầu.</span>';
    }
}

function renderModernCoach() {
    const coachContainer = document.getElementById("modernTrainCoach");
    if (!coachContainer) return;

    const requestedMask = buildSegmentMask(currentFilterFrom, currentFilterTo);

    const rowA = coachSeats.filter(s => s.column === "A");
    const rowB = coachSeats.filter(s => s.column === "B");
    const rowC = coachSeats.filter(s => s.column === "C");
    const rowD = coachSeats.filter(s => s.column === "D");

    const renderRowHtml = (seatsArray) => {
        return seatsArray.map(seat => {
            const mask = seat.occupiedMask;
            const conflict = (mask & requestedMask) !== 0;

            let cardClass = "";
            let badgeClass = "";
            let statusText = "";

            if (conflict) {
                cardClass = "border-rose-900/80 bg-rose-950/30 text-rose-300 opacity-60 hover:opacity-100 hover:border-rose-500";
                badgeClass = "bg-rose-950 text-rose-400 border border-rose-800";
                statusText = "Kẹt";
            } else {
                cardClass = "border-emerald-800/80 bg-emerald-950/20 text-emerald-300 hover:border-emerald-400 hover:scale-105";
                badgeClass = "bg-emerald-950 text-emerald-400 border border-emerald-800";
                statusText = "Trống";
            }

            let segmentsBar = '<div class="w-full flex h-1.5 gap-0.5 mt-1 rounded overflow-hidden bg-slate-900">';
            for (let s = 0; s < 4; s++) {
                const isOccupied = (mask >> s) & 1;
                const isRequested = s >= currentFilterFrom && s < currentFilterTo;
                
                let segColor = "bg-slate-800";
                if (isOccupied) {
                    segColor = "bg-rose-500";
                } else if (isRequested) {
                    segColor = "bg-cyan-400";
                } else {
                    segColor = "bg-emerald-500/50";
                }

                segmentsBar += `<div class="flex-1 ${segColor}"></div>`;
            }
            segmentsBar += '</div>';

            return `
                <button type="button"
                        id="seatBtn_${seat.id}"
                        onclick="selectSeatDetail(${seat.id})"
                        class="seat-card flex-1 min-w-[56px] p-2 rounded-lg border ${cardClass} flex flex-col items-center justify-between transition-all duration-200">
                    <div class="w-full flex items-center justify-between text-[10px] font-mono leading-none">
                        <span class="font-bold">${seat.seatCode}</span>
                        <span class="text-[8px] font-mono px-1 py-0.2 rounded ${badgeClass}">${statusText}</span>
                    </div>
                    <div class="my-0.5 text-xs font-mono font-bold text-slate-200">#${seat.id}</div>
                    ${segmentsBar}
                </button>
            `;
        }).join("");
    };

    coachContainer.innerHTML = `
        <div class="space-y-4">
            <div class="space-y-2">
                <div class="flex items-center gap-2">
                    <span class="w-16 text-xs font-bold text-cyan-400 shrink-0">HÀNG A</span>
                    <div class="flex-1 flex gap-2 overflow-x-auto pb-1">${renderRowHtml(rowA)}</div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="w-16 text-xs font-bold text-slate-400 shrink-0">HÀNG B</span>
                    <div class="flex-1 flex gap-2 overflow-x-auto pb-1">${renderRowHtml(rowB)}</div>
                </div>
            </div>

            <div class="h-6 rounded bg-slate-900/90 border border-slate-800 flex items-center justify-between px-4 text-xs font-mono text-slate-500 select-none">
                <span>&larr; Đầu toa</span>
                <span class="text-cyan-400 font-bold">LỐI ĐI GIỮA</span>
                <span>Cuối toa &rarr;</span>
            </div>

            <div class="space-y-2">
                <div class="flex items-center gap-2">
                    <span class="w-16 text-xs font-bold text-slate-400 shrink-0">HÀNG C</span>
                    <div class="flex-1 flex gap-2 overflow-x-auto pb-1">${renderRowHtml(rowC)}</div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="w-16 text-xs font-bold text-cyan-400 shrink-0">HÀNG D</span>
                    <div class="flex-1 flex gap-2 overflow-x-auto pb-1">${renderRowHtml(rowD)}</div>
                </div>
            </div>
        </div>
    `;
}

function updateCoachStats() {
    const requestedMask = buildSegmentMask(currentFilterFrom, currentFilterTo);
    let availableCount = 0;
    let conflictCount = 0;

    coachSeats.forEach(s => {
        if ((s.occupiedMask & requestedMask) === 0) {
            availableCount++;
        } else {
            conflictCount++;
        }
    });

    const availEl = document.getElementById("filterAvailableCount");
    const conflictEl = document.getElementById("filterConflictCount");

    if (availEl) availEl.innerText = `${availableCount}/40`;
    if (conflictEl) conflictEl.innerText = `${conflictCount}/40`;
}

function handleFilterJourneyChange() {
    const fromEl = document.getElementById("coachFilterFrom");
    const toEl = document.getElementById("coachFilterTo");
    if (!fromEl || !toEl) return;

    const fromVal = parseInt(fromEl.value, 10);
    const toVal = parseInt(toEl.value, 10);

    if (fromVal >= toVal) {
        alert("Ga xuất phát phải đi trước ga đến.");
        return;
    }

    currentFilterFrom = fromVal;
    currentFilterTo = toVal;

    renderModernCoach();
    updateCoachStats();
}

// ============================================================================
// BẢNG XEM CHI TIẾT KHI CLICK VÀO 1 GHẾ
// ============================================================================
function selectSeatDetail(seatId) {
    const seat = coachSeats.find(s => s.id === seatId);
    const panel = document.getElementById("modernSeatDetailPanel");
    if (!seat || !panel) return;

    document.querySelectorAll(".seat-card").forEach(el => el.classList.remove("ring-2", "ring-cyan-400", "scale-105"));
    const selectedBtn = document.getElementById(`seatBtn_${seatId}`);
    if (selectedBtn) selectedBtn.classList.add("ring-2", "ring-cyan-400", "scale-105");

    const requestedMask = buildSegmentMask(currentFilterFrom, currentFilterTo);
    const hasConflict = (seat.occupiedMask & requestedMask) !== 0;

    let segmentBlocks = "";
    for (let s = 0; s < 4; s++) {
        const isOccupied = (seat.occupiedMask >> s) & 1;
        const isFilterSeg = s >= currentFilterFrom && s < currentFilterTo;

        let blockClass = isOccupied ? "bg-rose-950/40 border-rose-800 text-rose-300" : "bg-emerald-950/30 border-emerald-800 text-emerald-300";
        let statusBadge = isOccupied ? "ĐÃ CÓ NGƯỜI" : "CÒN TRỐNG";

        if (isFilterSeg && !isOccupied) {
            statusBadge = "BẠN ĐANG CHỌN";
            blockClass = "bg-cyan-950/50 border-cyan-500 text-cyan-200 ring-1 ring-cyan-400";
        }

        segmentBlocks += `
            <div class="p-2.5 rounded-lg border ${blockClass}">
                <div class="flex items-center justify-between text-[11px] font-mono">
                    <span class="font-bold">Chặng ${s}</span>
                    <span class="px-1.5 py-0.2 rounded text-[10px] bg-slate-900">${statusBadge}</span>
                </div>
                <div class="text-xs font-bold mt-1 text-slate-100">${SEG_LABELS[s]}</div>
            </div>
        `;
    }

    panel.className = "mt-6 p-5 rounded-xl bg-slate-950 border border-slate-800 block";
    panel.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
                <h4 class="text-base font-bold text-slate-100">
                    Ghế ${seat.seatCode} (Số thứ tự: ${seat.id})
                </h4>
                <div class="text-xs text-slate-400 mt-0.5">
                    Trạng thái hiện tại: <span class="text-emerald-400 font-mono font-bold">0b${toBin(seat.occupiedMask)} (Số ${seat.occupiedMask})</span>
                </div>
            </div>
            <div>
                ${hasConflict 
                    ? '<span class="px-3 py-1 rounded bg-rose-950 border border-rose-800 text-rose-300 font-bold text-xs">TRÙNG CHẶNG BẠN CHỌN</span>' 
                    : '<span class="px-3 py-1 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold text-xs">CÒN TRỐNG, ĐẶT ĐƯỢC</span>'
                }
            </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 my-3">
            ${segmentBlocks}
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
            <div class="text-slate-400">
                ${hasConflict 
                    ? 'Ghế này đã có khách đặt ở chặng bạn chọn. Vui lòng bấm chọn ghế màu xanh khác.' 
                    : `Ghế trống cho chặng từ <strong>${STATIONS[currentFilterFrom].name}</strong> đến <strong>${STATIONS[currentFilterTo].name}</strong>.`
                }
            </div>

            ${!hasConflict ? `
                <button type="button" 
                        onclick="testBookCurrentSeat(${seat.id})"
                        class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold transition">
                    Thử đặt ghế này (Gộp bit)
                </button>
            ` : ''}
        </div>
    `;
}

function testBookCurrentSeat(seatId) {
    const seat = coachSeats.find(s => s.id === seatId);
    if (!seat) return;

    const requestedMask = buildSegmentMask(currentFilterFrom, currentFilterTo);
    seat.occupiedMask = seat.occupiedMask | requestedMask;

    renderModernCoach();
    updateCoachStats();
    selectSeatDetail(seatId);
}

// ============================================================================
// MÔ PHỎNG TÀU CHẠY & TỰ ĐỘNG NHẢ GHẾ TẠI MỖI GA
// ============================================================================
async function simulateLiveTrainJourney() {
    if (isTrainMoving) return;
    isTrainMoving = true;

    resetCoachSeats();

    const btn = document.getElementById("trainJourneyBtn");
    const statusMsg = document.getElementById("trainJourneyStatusMsg");
    if (btn) {
        btn.disabled = true;
        btn.innerText = "Đoàn tàu đang di chuyển qua các ga...";
    }

    const stationsList = [
        { idx: 0, name: "Hà Nội", desc: "Tàu xuất phát từ Ga Hà Nội. Các khách chặng đầu đã ngồi vào chỗ." },
        { idx: 1, name: "Phủ Lý", desc: "Đến Ga Phủ Lý: Khách chặng Hà Nội - Phủ Lý xuống tàu &rarr; Ghế tự động nhả (đổi sang xanh)!" },
        { idx: 2, name: "Ninh Bình", desc: "Đến Ga Ninh Bình: Khách chặng Phủ Lý - Ninh Bình xuống tàu &rarr; Nhả tiếp ghế!" },
        { idx: 3, name: "Thanh Hóa", desc: "Đến Ga Thanh Hóa: Khách chặng Ninh Bình - Thanh Hóa xuống tàu!" },
        { idx: 4, name: "Vinh", desc: "Cập bến Ga Vinh (Ga cuối): Toàn bộ ghế được giải phóng sạch sẽ cho chuyến mới." }
    ];

    for (let i = 0; i < stationsList.length; i++) {
        const st = stationsList[i];

        if (statusMsg) {
            statusMsg.innerHTML = `
                <div class="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
                    <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    <span>GA ${st.idx}: ${st.name} &rarr; ${st.desc}</span>
                </div>
            `;
        }

        updateTrainCarriagePosition(st.idx);

        if (st.idx > 0) {
            const passedSeg = st.idx - 1;
            const clearPassedMask = buildClearMask(1 << passedSeg);
            coachSeats.forEach(seat => {
                seat.occupiedMask = seat.occupiedMask & clearPassedMask;
            });
            renderModernCoach();
            updateCoachStats();
        }

        await new Promise(r => setTimeout(r, 1400));
    }

    if (statusMsg) {
        statusMsg.innerHTML = `
            <div class="text-emerald-400 font-mono text-xs font-bold">
                HOÀN TẤT: Tàu đã đến ga Vinh. Toàn bộ 40 ghế đã được nhả xong.
            </div>
        `;
    }

    if (btn) {
        btn.disabled = false;
        btn.innerText = "Chạy lại chuyến tàu";
    }
    isTrainMoving = false;
}

function updateTrainCarriagePosition(stationIdx) {
    const trainIcon = document.getElementById("animatedTrainIcon");
    if (!trainIcon) return;
    const percentages = [0, 25, 50, 75, 100];
    trainIcon.style.left = `${percentages[stationIdx]}%`;
}

async function fetchLiveSeatsFromDatabase() {
    const btn = document.getElementById("fetchLiveSeatsBtn");
    const statusMsg = document.getElementById("trainJourneyStatusMsg");

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span> ĐANG TẢI...';
    }

    try {
        const url = `/api/v1/trips/SE1-2026/seats?from=${currentFilterFrom}&to=${currentFilterTo}`;
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        const seatsData = json.data?.seats || [];

        if (seatsData.length > 0) {
            seatsData.forEach(item => {
                const target = coachSeats.find(s => s.id === item.seatNumber);
                if (target) {
                    target.occupiedMask = item.occupiedMask;
                }
            });

            renderModernCoach();
            updateCoachStats();

            if (statusMsg) {
                statusMsg.innerHTML = `
                    <div class="text-emerald-400 font-mono text-xs font-bold flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span>Đã tải 40 ghế từ Database thực tế (Chuyến SE1-2026).</span>
                    </div>
                `;
            }
        }
    } catch (err) {
        if (statusMsg) {
            statusMsg.innerHTML = `
                <div class="text-amber-400 font-mono text-xs flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>Đang dùng dữ liệu mô phỏng Offline (${err.message}). Vẫn test được đầy đủ các tính năng.</span>
                </div>
            `;
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `TẢI TỪ DATABASE`;
        }
    }
}
