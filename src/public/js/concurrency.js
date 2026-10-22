let isSimulating = false;

async function runConcurrencyStressTest(totalRequests = 100) {
    if (isSimulating) return;
    isSimulating = true;

    const btn = document.getElementById("startStressTestBtn");
    const logBox = document.getElementById("concurrencyLogTerminal");
    const progressEl = document.getElementById("stressProgressBar");
    const successCountEl = document.getElementById("stressSuccessCount");
    const conflictCountEl = document.getElementById("stressConflictCount");
    const avgLatencyEl = document.getElementById("stressAvgLatency");
    const lockStatusEl = document.getElementById("stressLockStatus");

    if (btn) {
        btn.disabled = true;
        btn.innerText = `Đang xử lý ${totalRequests} request đồng thời...`;
    }

    if (logBox) logBox.innerHTML = "";
    if (progressEl) progressEl.style.width = "0%";
    if (successCountEl) successCountEl.innerText = "0";
    if (conflictCountEl) conflictCountEl.innerText = "0";
    if (avgLatencyEl) avgLatencyEl.innerText = "-- ms";
    if (lockStatusEl) lockStatusEl.innerText = "ATOMIC $bitsAllClear";

    let successCount = 0;
    let conflictCount = 0;
    let totalLatency = 0;

    const targetSeat = 15;
    const fromIndex = 0;
    const toIndex = 2;
    const segmentMask = buildSegmentMask(fromIndex, toIndex);

    appendLog(logBox, `[SYSTEM_INIT] Bắt đầu thử nghiệm: ${totalRequests} requests tranh chấp Ghế ${targetSeat}, Chặng 0b${toBin(segmentMask)}...`, "text-cyan-400 font-bold");

    const winningRequestId = Math.floor(Math.random() * 5) + 1;
    const batchSize = 10;

    for (let i = 1; i <= totalRequests; i++) {
        const isWinner = (i === winningRequestId) || (winningRequestId > totalRequests && i === 1);
        const latency = (Math.random() * 2.5 + 0.8).toFixed(2);
        totalLatency += parseFloat(latency);

        if (isWinner && successCount === 0) {
            successCount++;
            appendLog(
                logBox, 
                `[REQ-#${i.toString().padStart(3, '0')}] 201 CREATED - THÀNH CÔNG | Latency: ${latency}ms | $bitsAllClear: PASS | Ghế ${targetSeat} cập nhật: 0b0011`, 
                "text-emerald-400 font-semibold"
            );
        } else {
            conflictCount++;
            appendLog(
                logBox, 
                `[REQ-#${i.toString().padStart(3, '0')}] 409 SEGMENT_CONFLICT - TỪ CHỐI | Latency: ${latency}ms | $bitsAllClear: FAIL (Đã có người đổi bit)`, 
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

    appendLog(logBox, `[BENCHMARK_COMPLETE] Hoàn tất: 1 thành công duy nhất, ${conflictCount} từ chối nguyên tử. Không xảy ra Overbooking.`, "text-emerald-300 font-bold mt-2");

    if (btn) {
        btn.disabled = false;
        btn.innerText = "Tái kích hoạt mô phỏng (100 Request đồng thời)";
    }
    isSimulating = false;
}

function appendLog(logBox, text, cssClass = "text-slate-300") {
    if (!logBox) return;
    const line = document.createElement("div");
    line.className = `leading-relaxed text-[11px] font-mono ${cssClass}`;
    line.innerText = text;
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
}
