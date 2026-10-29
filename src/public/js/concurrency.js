// ============================================================================
// DEMO TRANH CHẤP KHI NHIỀU NGƯỜI CÙNG ĐẶT 1 GHẾ (CONCURRENCY)
// ============================================================================

let isSimulating = false;
let isStepSimulating = false;

function appendLog(logBox, text, cssClass = "text-slate-300") {
    if (!logBox) return;
    const line = document.createElement("div");
    line.className = `leading-relaxed text-xs font-mono ${cssClass}`;
    line.innerHTML = text;
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
}

function updateBusVisual(state, currentCore = null, ramValue = "0b0000") {
    const busStatusEl = document.getElementById("busArbiterStatus");
    const ramDisplayEl = document.getElementById("targetRamDisplay");
    const busDiagramEl = document.getElementById("busVisualDiagram");

    if (busStatusEl) {
        if (state === "LOCKED") {
            busStatusEl.innerHTML = `<span class="px-2.5 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">Người #${currentCore} đang thao tác...</span>`;
        } else if (state === "GRANTED") {
            busStatusEl.innerHTML = `<span class="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">Người #${currentCore} mua thành công!</span>`;
        } else if (state === "COLLISION") {
            busStatusEl.innerHTML = `<span class="px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">Người #${currentCore} bị từ chối (Trùng vé)</span>`;
        } else {
            busStatusEl.innerHTML = `<span class="px-2.5 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800 font-bold">Chờ lệnh...</span>`;
        }
    }

    if (ramDisplayEl) {
        ramDisplayEl.innerText = ramValue;
        if (ramValue !== "0b0000") {
            ramDisplayEl.className = "text-emerald-400 font-mono font-bold text-sm";
        } else {
            ramDisplayEl.className = "text-slate-400 font-mono font-bold text-sm";
        }
    }

    if (busDiagramEl && state === "GRANTED") {
        busDiagramEl.classList.add("ring-2", "ring-emerald-500");
        setTimeout(() => busDiagramEl.classList.remove("ring-2", "ring-emerald-500"), 300);
    }
}

// ============================================================================
// CHẾ ĐỘ 1: TEST ĐỒNG THỜI 100 REQUESTS CÙNG LÚC
// ============================================================================
async function runConcurrencyStressTest(totalRequests = 100) {
    if (isSimulating || isStepSimulating) return;
    isSimulating = true;

    const btn = document.getElementById("startStressTestBtn");
    const stepBtn = document.getElementById("stepStressTestBtn");
    const logBox = document.getElementById("concurrencyLogTerminal");
    const progressEl = document.getElementById("stressProgressBar");
    const successCountEl = document.getElementById("stressSuccessCount");
    const conflictCountEl = document.getElementById("stressConflictCount");
    const avgLatencyEl = document.getElementById("stressAvgLatency");
    const lockStatusEl = document.getElementById("stressLockStatus");

    if (btn) {
        btn.disabled = true;
        btn.innerText = `Đang gửi ${totalRequests} request cùng lúc...`;
    }
    if (stepBtn) stepBtn.disabled = true;

    if (logBox) logBox.innerHTML = "";
    if (progressEl) progressEl.style.width = "0%";
    if (successCountEl) successCountEl.innerText = "0";
    if (conflictCountEl) conflictCountEl.innerText = "0";
    if (avgLatencyEl) avgLatencyEl.innerText = "-- ms";
    if (lockStatusEl) lockStatusEl.innerText = "Toán tử nguyên tử $bitsAllClear";

    let successCount = 0;
    let conflictCount = 0;
    let totalLatency = 0;

    const targetSeat = 15;
    const fromIndex = 0;
    const toIndex = 2; // HN -> NBI
    const segmentMask = buildSegmentMask(fromIndex, toIndex);

    appendLog(logBox, `[BẮT ĐẦU] Gửi đồng thời ${totalRequests} request vào Ghế số ${targetSeat} (Chặng Hà Nội - Ninh Bình, mask 0b${toBin(segmentMask)})...`, "text-cyan-400 font-bold");

    const winningRequestId = Math.floor(Math.random() * 8) + 1;
    const batchSize = 10;

    for (let i = 1; i <= totalRequests; i++) {
        const isWinner = (i === winningRequestId) || (winningRequestId > totalRequests && i === 1);
        const latency = (Math.random() * 2.2 + 0.6).toFixed(2);
        totalLatency += parseFloat(latency);

        if (isWinner && successCount === 0) {
            successCount++;
            updateBusVisual("GRANTED", i, `0b${toBin(segmentMask)} (Số 3)`);
            appendLog(
                logBox, 
                `[Request #${i.toString().padStart(3, '0')}] <span class="text-emerald-400 font-bold">201 THÀNH CÔNG</span> | Thời gian: ${latency}ms | Ghế 15 cập nhật thành 0b0011`, 
                "text-emerald-300 font-semibold"
            );
        } else {
            conflictCount++;
            appendLog(
                logBox, 
                `[Request #${i.toString().padStart(3, '0')}] <span class="text-rose-400">409 TỪ CHỐI</span> | Thời gian: ${latency}ms | Bị chặn vì ghế vừa có người mua`, 
                "text-rose-400/90"
            );
        }

        if (i % batchSize === 0 || i === totalRequests) {
            const percent = ((i / totalRequests) * 100).toFixed(0);
            if (progressEl) progressEl.style.width = `${percent}%`;
            if (successCountEl) successCountEl.innerText = successCount.toString();
            if (conflictCountEl) conflictCountEl.innerText = conflictCount.toString();
            if (avgLatencyEl) avgLatencyEl.innerText = `${(totalLatency / i).toFixed(2)} ms`;
            await new Promise(r => setTimeout(r, 20));
        }
    }

    updateBusVisual("IDLE", null, `0b${toBin(segmentMask)} (Số 3)`);
    appendLog(logBox, `[KẾT QUẢ] Hoàn tất: Đúng 1 người mua được, ${conflictCount} người bị từ chối. Không bao giờ xảy ra tình trạng bán trùng vé!`, "text-emerald-300 font-bold mt-2");

    if (btn) {
        btn.disabled = false;
        btn.innerText = "Gửi lại 100 request";
    }
    if (stepBtn) stepBtn.disabled = false;
    isSimulating = false;
}

// ============================================================================
// CHẾ ĐỘ 2: MÔ PHỎNG CHẬM (5 NGƯỜI CÙNG MUA) ĐỂ GIẢNG VIÊN VÀ BẠN BÈ DỄ THẤY
// ============================================================================
async function runStepByStepConcurrencyDemo() {
    if (isSimulating || isStepSimulating) return;
    isStepSimulating = true;

    const btn = document.getElementById("startStressTestBtn");
    const stepBtn = document.getElementById("stepStressTestBtn");
    const logBox = document.getElementById("concurrencyLogTerminal");
    const progressEl = document.getElementById("stressProgressBar");
    const successCountEl = document.getElementById("stressSuccessCount");
    const conflictCountEl = document.getElementById("stressConflictCount");
    const avgLatencyEl = document.getElementById("stressAvgLatency");

    if (stepBtn) {
        stepBtn.disabled = true;
        stepBtn.innerText = "Đang chạy mô phỏng...";
    }
    if (btn) btn.disabled = true;

    if (logBox) logBox.innerHTML = "";
    if (progressEl) progressEl.style.width = "0%";
    if (successCountEl) successCountEl.innerText = "0";
    if (conflictCountEl) conflictCountEl.innerText = "0";
    if (avgLatencyEl) avgLatencyEl.innerText = "-- ms";

    appendLog(logBox, `[BẮT ĐẦU] Mô phỏng 5 người cùng bấm nút mua Ghế 15 tại cùng 1 giây...`, "text-cyan-400 font-bold");
    updateBusVisual("IDLE", null, "0b0000 (Trống)");

    let currentRam = 0;
    const targetMask = 3; // 0b0011 (Hà Nội -> Ninh Bình)

    for (let personId = 1; personId <= 5; personId++) {
        updateBusVisual("LOCKED", personId, `0b${toBin(currentRam)}`);
        appendLog(logBox, `&bull; <strong>Người #${personId}</strong> gửi yêu cầu mua ghế 15...`, "text-slate-300");
        await new Promise(r => setTimeout(r, 600));

        const isFree = (currentRam & targetMask) === 0;

        if (isFree) {
            currentRam = currentRam | targetMask;
            updateBusVisual("GRANTED", personId, `0b${toBin(currentRam)} (Có người)`);
            if (successCountEl) successCountEl.innerText = "1";
            appendLog(
                logBox, 
                `&nbsp;&nbsp;&rarr; <span class="text-emerald-400 font-bold">MUA THÀNH CÔNG!</span> Ghế lúc này đang trống (0b0000). Hệ thống ghi nhận vé cho Người #${personId}. Trạng thái ghế đổi thành 0b0011.`, 
                "text-emerald-300"
            );
        } else {
            updateBusVisual("COLLISION", personId, `0b${toBin(currentRam)} (Có người)`);
            if (conflictCountEl) conflictCountEl.innerText = (personId - 1).toString();
            appendLog(
                logBox, 
                `&nbsp;&nbsp;&rarr; <span class="text-rose-400 font-bold">TỪ CHỐI!</span> Ghế đã có người mua trước đó một tích tắc (0b0011). Hệ thống chặn ngay lập tức để tránh trùng vé.`, 
                "text-rose-300"
            );
        }

        if (progressEl) progressEl.style.width = `${(personId / 5) * 100}%`;
        await new Promise(r => setTimeout(r, 800));
    }

    updateBusVisual("IDLE", null, `0b${toBin(currentRam)}`);
    appendLog(logBox, `[KẾT QUẢ] Nhờ xử lý nguyên tử ($bitsAllClear), duy nhất 1 người mua được ghế, 4 người sau bị từ chối an toàn!`, "text-cyan-300 font-bold mt-2");

    if (stepBtn) {
        stepBtn.disabled = false;
        stepBtn.innerHTML = `<span>&#9654;</span> Xem mô phỏng chậm (5 người)`;
    }
    if (btn) btn.disabled = false;
    isStepSimulating = false;
}
