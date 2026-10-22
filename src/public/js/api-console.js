async function sendLiveApiRequest() {
    const endpointSelect = document.getElementById("apiConsoleEndpoint");
    const methodEl = document.getElementById("apiConsoleMethod");
    const bodyInputEl = document.getElementById("apiConsoleRequestBody");
    const responseOutputEl = document.getElementById("apiConsoleResponseOutput");
    const statusBadgeEl = document.getElementById("apiConsoleStatusCode");
    const latencyEl = document.getElementById("apiConsoleLatency");
    const btn = document.getElementById("apiConsoleSendBtn");

    if (!endpointSelect || !responseOutputEl) return;

    const endpoint = endpointSelect.value;
    const method = methodEl ? methodEl.innerText : "GET";

    if (btn) btn.disabled = true;
    if (statusBadgeEl) {
        statusBadgeEl.innerText = "PENDING...";
        statusBadgeEl.className = "px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-400";
    }
    if (latencyEl) latencyEl.innerText = "-- ms";
    responseOutputEl.innerText = "// Đang kết nối tới máy chủ Express...";

    const startTime = performance.now();

    try {
        const options = {
            method: method,
            headers: {
                "Content-Type": "application/json"
            }
        };

        if (method === "POST" && bodyInputEl && bodyInputEl.value.trim()) {
            options.body = bodyInputEl.value.trim();
        }

        const res = await fetch(endpoint, options);
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(1);

        const data = await res.json().catch(() => ({ status: res.statusText }));

        if (statusBadgeEl) {
            statusBadgeEl.innerText = `${res.status} ${res.statusText}`;
            if (res.ok) {
                statusBadgeEl.className = "px-2 py-0.5 rounded text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-800";
            } else {
                statusBadgeEl.className = "px-2 py-0.5 rounded text-xs font-mono bg-rose-950 text-rose-400 border border-rose-800";
            }
        }

        if (latencyEl) latencyEl.innerText = `${duration} ms`;
        responseOutputEl.innerText = JSON.stringify(data, null, 2);

    } catch (err) {
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(1);

        if (statusBadgeEl) {
            statusBadgeEl.innerText = "CONN_ERR";
            statusBadgeEl.className = "px-2 py-0.5 rounded text-xs font-mono bg-amber-950 text-amber-400 border border-amber-800";
        }
        if (latencyEl) latencyEl.innerText = `${duration} ms`;
        responseOutputEl.innerText = `// Lỗi kết nối HTTP:\n${err.message}\n(Kiểm tra xem backend Express đã khởi động trên cổng 5000 chưa)`;
    } finally {
        if (btn) btn.disabled = false;
    }
}

function handleApiConsoleEndpointChange() {
    const endpointSelect = document.getElementById("apiConsoleEndpoint");
    const methodEl = document.getElementById("apiConsoleMethod");
    const bodyContainer = document.getElementById("apiConsoleBodyContainer");
    const bodyInput = document.getElementById("apiConsoleRequestBody");

    if (!endpointSelect || !methodEl) return;

    const val = endpointSelect.value;

    if (val.startsWith("/health") || val.includes("/seats")) {
        methodEl.innerText = "GET";
        if (bodyContainer) bodyContainer.style.display = "none";
    } else if (val.includes("/auth/login")) {
        methodEl.innerText = "POST";
        if (bodyContainer) bodyContainer.style.display = "block";
        if (bodyInput) {
            bodyInput.value = JSON.stringify({
                email: "demo@railway.vn",
                password: "Password@123"
            }, null, 2);
        }
    } else if (val.includes("/bookings")) {
        methodEl.innerText = "POST";
        if (bodyContainer) bodyContainer.style.display = "block";
        if (bodyInput) {
            bodyInput.value = JSON.stringify({
                tripId: "SE1-2026",
                seatNumber: 12,
                fromIndex: 0,
                toIndex: 2
            }, null, 2);
        }
    }
}
