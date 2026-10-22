let rateLimitCounter = 0;
let rateLimitTimer = null;
const RATE_LIMIT_THRESHOLD = 15;

function simulateRateLimitSpam() {
    rateLimitCounter++;
    const countEl = document.getElementById("rateLimitSpamCount");
    const statusEl = document.getElementById("rateLimitSpamStatus");
    const barEl = document.getElementById("rateLimitSpamBar");

    if (countEl) countEl.innerText = rateLimitCounter.toString();

    const percentage = Math.min(100, (rateLimitCounter / RATE_LIMIT_THRESHOLD) * 100);
    if (barEl) barEl.style.width = `${percentage}%`;

    if (rateLimitCounter >= RATE_LIMIT_THRESHOLD) {
        if (statusEl) {
            statusEl.innerHTML = `
                <div class="p-3 rounded-lg bg-rose-950/50 border border-rose-700 text-rose-300 font-mono text-xs">
                    <span class="font-bold text-rose-200">HTTP 429 TOO MANY REQUESTS</span>
                    <div class="mt-1 text-[11px] text-rose-300/80">
                        Vượt quá giới hạn request cho phép. Middleware express-rate-limit đã chặn yêu cầu.
                    </div>
                </div>
            `;
        }
    } else {
        if (statusEl) {
            statusEl.innerHTML = `
                <div class="p-3 rounded-lg bg-emerald-950/40 border border-emerald-700 text-emerald-300 font-mono text-xs">
                    <span class="font-bold text-emerald-200">HTTP 200 OK (${rateLimitCounter}/${RATE_LIMIT_THRESHOLD} requests)</span>
                    <div class="mt-1 text-[11px] text-slate-400">
                        Header: <code class="text-cyan-300">RateLimit-Remaining: ${RATE_LIMIT_THRESHOLD - rateLimitCounter}</code>.
                    </div>
                </div>
            `;
        }
    }

    clearTimeout(rateLimitTimer);
    rateLimitTimer = setTimeout(() => {
        rateLimitCounter = 0;
        if (countEl) countEl.innerText = "0";
        if (barEl) barEl.style.width = "0%";
        if (statusEl) {
            statusEl.innerHTML = `
                <div class="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 font-mono text-xs">
                    Hết thời gian giới hạn. Bộ đếm đã reset về 0.
                </div>
            `;
        }
    }, 5000);
}

async function simulateTokenRotation() {
    const statusEl = document.getElementById("jwtRotationStatus");
    const accessStatusEl = document.getElementById("jwtAccessTokenStatus");
    const refreshStatusEl = document.getElementById("jwtRefreshTokenStatus");
    const btn = document.getElementById("jwtRotationBtn");

    if (btn) btn.disabled = true;

    if (accessStatusEl) accessStatusEl.className = "text-rose-400 font-bold font-mono text-xs";
    if (accessStatusEl) accessStatusEl.innerText = "EXPIRED (15 phút)";
    if (statusEl) statusEl.innerText = "1. AccessToken hết hạn. Client gửi yêu cầu cấp mới qua POST /api/v1/auth/refresh-token...";

    await new Promise(r => setTimeout(r, 900));

    if (statusEl) statusEl.innerText = "2. Server đối soát RefreshToken trong DB...";
    await new Promise(r => setTimeout(r, 900));

    if (accessStatusEl) accessStatusEl.className = "text-emerald-400 font-bold font-mono text-xs";
    if (accessStatusEl) accessStatusEl.innerText = "ACTIVE (Mới cấp, TTL: 15m)";
    if (refreshStatusEl) refreshStatusEl.innerText = "VALID (Còn hạn trong DB)";
    if (statusEl) statusEl.innerText = "3. Cấp AccessToken mới thành công. Tiếp tục phiên làm việc bình thường.";

    if (btn) btn.disabled = false;
}
