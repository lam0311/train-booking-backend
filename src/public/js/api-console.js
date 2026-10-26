let currentAuthToken = null;
let lastCreatedBookingId = null;

async function sendLiveApiRequest() {
    const endpointSelect = document.getElementById("apiConsoleEndpoint");
    const methodEl = document.getElementById("apiConsoleMethod");
    const bodyInputEl = document.getElementById("apiConsoleRequestBody");
    const responseOutputEl = document.getElementById("apiConsoleResponseOutput");
    const statusBadgeEl = document.getElementById("apiConsoleStatusCode");
    const latencyEl = document.getElementById("apiConsoleLatency");
    const tokenStatusEl = document.getElementById("apiConsoleTokenStatus");
    const btn = document.getElementById("apiConsoleSendBtn");

    if (!endpointSelect || !responseOutputEl) return;

    let endpoint = endpointSelect.value;
    const method = methodEl ? methodEl.innerText : "GET";

    if (endpoint.includes(":bookingId")) {
        if (lastCreatedBookingId) {
            endpoint = endpoint.replace(":bookingId", lastCreatedBookingId);
        } else {
            responseOutputEl.innerText = "// Vui lòng đặt vé trước (POST /api/v1/bookings) để có mã bookingId hủy thử.";
            return;
        }
    }

    if (btn) btn.disabled = true;
    if (statusBadgeEl) {
        statusBadgeEl.innerText = "PENDING...";
        statusBadgeEl.className = "px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-400";
    }
    if (latencyEl) latencyEl.innerText = "-- ms";
    responseOutputEl.innerText = `// Đang gửi ${method} ${endpoint}...`;

    const startTime = performance.now();

    try {
        const headers = {
            "Content-Type": "application/json"
        };

        if (currentAuthToken) {
            headers["Authorization"] = `Bearer ${currentAuthToken}`;
        }

        if (method === "POST" && endpoint.includes("/bookings")) {
            const uuid = (window.crypto && crypto.randomUUID) 
                ? crypto.randomUUID() 
                : "idemp-" + Math.random().toString(36).substring(2, 10);
            headers["Idempotency-Key"] = uuid;
        }

        const options = {
            method: method,
            headers: headers
        };

        if ((method === "POST" || method === "PUT") && bodyInputEl && bodyInputEl.value.trim()) {
            options.body = bodyInputEl.value.trim();
        }

        const res = await fetch(endpoint, options);
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(1);

        const data = await res.json().catch(() => ({ status: res.statusText }));

        if (data.data?.accessToken) {
            currentAuthToken = data.data.accessToken;
            if (tokenStatusEl) {
                tokenStatusEl.innerText = "TOKEN: ĐÃ LƯU (demo)";
                tokenStatusEl.className = "px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800";
            }
        }

        if (data.data?.booking?.bookingId) {
            lastCreatedBookingId = data.data.booking.bookingId;
        }

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

    if (val.includes("/bookings/:bookingId")) {
        methodEl.innerText = "DELETE";
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
    } else if (val.endsWith("/bookings") && !val.includes("/me")) {
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
    } else {
        methodEl.innerText = "GET";
        if (bodyContainer) bodyContainer.style.display = "none";
    }
}

async function quickLoginDemoUser() {
    const outputEl = document.getElementById("apiConsoleResponseOutput");
    const statusBadgeEl = document.getElementById("apiConsoleStatusCode");
    const tokenStatusEl = document.getElementById("apiConsoleTokenStatus");

    if (outputEl) outputEl.innerText = "// Đang đăng nhập tài khoản demo@railway.vn để lấy token...";

    try {
        let res = await fetch("/api/v1/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "demo@railway.vn", password: "Password@123" })
        });

        let json = await res.json().catch(() => ({}));

        if (!res.ok) {
            await fetch("/api/v1/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: "demo@railway.vn", password: "Password@123" })
            });

            res = await fetch("/api/v1/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: "demo@railway.vn", password: "Password@123" })
            });
            json = await res.json().catch(() => ({}));
        }

        if (json.data?.accessToken) {
            currentAuthToken = json.data.accessToken;
            if (tokenStatusEl) {
                tokenStatusEl.innerText = "TOKEN: ĐÃ LƯU (demo)";
                tokenStatusEl.className = "px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800";
            }
        }

        if (statusBadgeEl) {
            statusBadgeEl.innerText = `${res.status} ${res.statusText}`;
            statusBadgeEl.className = "px-2 py-0.5 rounded text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-800";
        }

        if (outputEl) outputEl.innerText = JSON.stringify(json, null, 2);

    } catch (err) {
        if (outputEl) outputEl.innerText = "// Không thể đăng nhập: " + err.message;
    }
}
