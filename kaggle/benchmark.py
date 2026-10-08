import asyncio
import aiohttp
import time
import json
import uuid
import random
import string
from datetime import datetime
from collections import Counter

BASE_URL    = "https://train-booking-backend-3ri7.onrender.com"
COMMIT_HASH = "de4ef84"

USER_STEPS = [50, 100, 150, 200, 300, 400, 500, 600, 700, 800,
              900, 1000, 1200, 1400, 1600, 1800, 2000, 2200,
              2400, 2600, 2800, 3000]

REQUESTS_PER_STEP = 4000
BREAK_ERROR_PCT   = 5
BREAK_P99_MS      = 5000

TEST_ALL_ENDPOINTS = False

ENDPOINTS = {
    "GET_SEATS": {
        "label":  "GET /seats",
        "method": "GET",
        "path":   "/api/v1/trips/SE1-2026/seats?from=0&to=2",
        "auth":   False,
        "body":   None,
    },
    "POST_BOOKING": {
        "label":  "POST /bookings",
        "method": "POST",
        "path":   "/api/v1/bookings",
        "auth":   True,
        "body": {
            "tripId":     "SE1-2026",
            "seatNumber": 1,
            "fromIndex":  0,
            "toIndex":    2,
        },
    },
}

TEST_EMAIL    = None
TEST_PASSWORD = "Benchmark@2026"


def random_email():
    tag = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"bench_{tag}@test.com"


def percentile(sorted_list, p):
    if not sorted_list:
        return 0
    index = max(0, int(len(sorted_list) * p / 100) - 1)
    return round(sorted_list[index], 0)


async def send_request(session, method, url, body=None, headers=None):
    t_start = time.perf_counter()
    try:
        async with session.request(
            method, url,
            json=body,
            headers=headers or {"Content-Type": "application/json"},
            timeout=aiohttp.ClientTimeout(total=15),
        ) as response:
            text = await response.text()
            latency_ms = (time.perf_counter() - t_start) * 1000
            try:
                data = json.loads(text)
            except Exception:
                data = None
            return response.status, latency_ms, data
    except Exception:
        latency_ms = (time.perf_counter() - t_start) * 1000
        return 0, latency_ms, None


async def setup_test_account(session):
    global TEST_EMAIL
    TEST_EMAIL = random_email()
    print(f"  Dang ky: {TEST_EMAIL}")

    status, _, data = await send_request(
        session, "POST",
        BASE_URL + "/api/v1/auth/register",
        {"email": TEST_EMAIL, "password": TEST_PASSWORD},
    )
    if status not in (200, 201, 409):
        print(f"  Dang ky that bai: {status}")
        return None

    status, _, data = await send_request(
        session, "POST",
        BASE_URL + "/api/v1/auth/login",
        {"email": TEST_EMAIL, "password": TEST_PASSWORD},
    )
    if status != 200 or not data:
        print(f"  Login that bai: {status}")
        return None

    token = None
    if isinstance(data, dict):
        token = (
            data.get("accessToken")
            or data.get("access_token")
            or (data.get("data", {}) or {}).get("accessToken")
            or (data.get("data", {}) or {}).get("access_token")
            or (data.get("data", {}) or {}).get("tokens", {}).get("accessToken")
        )

    if token:
        print(f"  Login OK, co token.")
    else:
        print(f"  Khong tim thay token: {json.dumps(data)[:200]}")
    return token


async def run_step(session, endpoint, concurrency, total, token=None):
    method    = endpoint["method"]
    base_path = endpoint["path"]
    need_auth = endpoint["auth"]
    base_body = endpoint["body"]

    results = []
    t_start = time.perf_counter()

    for i in range(0, total, concurrency):
        batch_size = min(concurrency, total - i)
        tasks = []

        for _ in range(batch_size):
            url = BASE_URL + base_path
            body = None
            headers = {"Content-Type": "application/json"}

            if need_auth and token:
                headers["Authorization"] = f"Bearer {token}"

            if method == "POST" and base_body:
                body = dict(base_body)
                body["seatNumber"] = random.randint(1, 40)
                headers["Idempotency-Key"] = str(uuid.uuid4())

            tasks.append(send_request(session, method, url, body, headers))

        batch_results = await asyncio.gather(*tasks)
        results.extend(batch_results)

    duration_s = time.perf_counter() - t_start

    statuses  = [s for s, _, _ in results]
    latencies = sorted(lat for _, lat, _ in results)

    success_count = sum(1 for s in statuses if 200 <= s < 300)
    failed_count  = total - success_count
    error_pct     = round(failed_count / total * 100, 1) if total > 0 else 0

    return {
        "concurrency":   concurrency,
        "throughput":    round(total / duration_s, 1) if duration_s > 0 else 0,
        "p50":           percentile(latencies, 50),
        "p95":           percentile(latencies, 95),
        "p99":           percentile(latencies, 99),
        "max":           round(max(latencies), 0) if latencies else 0,
        "success":       success_count,
        "error_pct":     error_pct,
        "status_counts": dict(Counter(statuses)),
        "total":         total,
    }


async def wake_up(session):
    print("---- WAKE UP ----")
    url = BASE_URL + "/api/v1/trips/SE1-2026/seats?from=0&to=2"
    stable_count = 0
    attempt = 0
    t_start = time.time()

    while time.time() - t_start < 120:
        attempt += 1
        status, latency_ms, _ = await send_request(session, "GET", url, None)
        elapsed = time.time() - t_start

        if status == 200 and latency_ms < 500:
            stable_count += 1
            state = "stable"
        else:
            stable_count = 0
            state = "waiting"

        print(f"  [{elapsed:5.1f}s] #{attempt:2d}: "
              f"{latency_ms:6.0f}ms  [{state}]  ({stable_count}/3)")

        if stable_count >= 3:
            wake_time = round(time.time() - t_start, 1)
            print(f"\nServer ready sau {wake_time}s\n")
            return wake_time

        await asyncio.sleep(2)

    raise RuntimeError("Server khong stable sau 120s")


async def warm_up(session):
    print("---- WARM UP (20s) ----")
    url = BASE_URL + "/api/v1/trips/SE1-2026/seats?from=0&to=2"
    sent = 0
    t_start = time.time()

    while time.time() - t_start < 20:
        await send_request(session, "GET", url, None)
        sent += 1
        if sent % 10 == 0:
            print(f"  [{time.time() - t_start:4.0f}s] {sent} requests")
        await asyncio.sleep(0.1)

    print(f"Warm-up xong ({sent} requests)\n")


async def step_load_test(session, endpoint, token=None):
    label = endpoint["label"]
    print(f"---- STEP LOAD TEST: {label} ----")
    print(f"Endpoint: {endpoint['method']} {endpoint['path']}")
    print(f"{len(USER_STEPS)} buoc, {REQUESTS_PER_STEP} req/buoc\n")

    header = f"{'Users':>6} | {'req/s':>7} | {'p50':>8} | {'p95':>8} | {'p99':>8} | {'max':>8} | {'err%':>6} | Status"
    print(header)
    print("-" * len(header))

    all_steps = []
    broken_at = None

    for concurrency in USER_STEPS:
        result = await run_step(session, endpoint, concurrency, REQUESTS_PER_STEP, token)

        is_error_high = result["error_pct"] > BREAK_ERROR_PCT
        is_too_slow   = result["p99"] > BREAK_P99_MS

        if (is_error_high or is_too_slow) and broken_at is None:
            broken_at = concurrency
            status_label = "BREAKING POINT"
        elif is_too_slow:
            status_label = "SLOW"
        elif is_error_high:
            status_label = "HIGH ERROR"
        else:
            status_label = "OK"

        print(f"  {concurrency:>4}  | "
              f"{result['throughput']:>7.0f} | "
              f"{result['p50']:>6.0f}ms | "
              f"{result['p95']:>6.0f}ms | "
              f"{result['p99']:>6.0f}ms | "
              f"{result['max']:>6.0f}ms | "
              f"{result['error_pct']:>5.1f}% | "
              f"{status_label}")

        all_steps.append({**result, "status": status_label, "label": label})

        if result["error_pct"] > 50:
            print(f"\nError {result['error_pct']}% > 50%, dung som.")
            break

        await asyncio.sleep(5)

    return all_steps, broken_at


def print_summary(all_results, wake_time):
    now = datetime.now().strftime("%Y-%m-%d %H:%M")

    print("\n" + "=" * 62)
    print("RESULT SUMMARY")
    print("=" * 62)
    print(f"  Timestamp  : {now}")
    print(f"  Commit     : {COMMIT_HASH}")
    print(f"  Server     : Render Free Tier")
    print(f"  Client     : Kaggle CPU")
    print(f"  Wake-up    : {wake_time}s")
    print(f"  Req/step   : {REQUESTS_PER_STEP}")
    print()

    for label, data in all_results.items():
        steps     = data["steps"]
        broken_at = data["broken_at"]
        ok_steps  = [s for s in steps if s["status"] == "OK"]

        print(f"  [{label}]")
        if ok_steps:
            max_users = max(s["concurrency"] for s in ok_steps)
            best_rps  = max(s["throughput"]  for s in ok_steps)
            print(f"    Max stable users : {max_users}")
            print(f"    Best throughput  : {best_rps:.0f} req/s")
        else:
            print(f"    Khong co step nao stable.")

        if broken_at:
            print(f"    Breaking point   : {broken_at} concurrent users")
        else:
            print(f"    Breaking point   : Chua dat (>{max(USER_STEPS)} users)")
        print()

    print("=" * 62)

    # CSV de dan vao sheet
    print("\n--- CSV ---")
    print("endpoint,concurrency,throughput,p50,p95,p99,max,error_pct,status")
    for label, data in all_results.items():
        for s in data["steps"]:
            print(f"{label},{s['concurrency']},{s['throughput']},"
                  f"{s['p50']},{s['p95']},{s['p99']},{s['max']},"
                  f"{s['error_pct']},{s['status']}")


async def main():
    print("=" * 62)
    print("STEP LOAD TEST - Train Booking Backend")
    print(f"Target : {BASE_URL}")
    print(f"Commit : {COMMIT_HASH}")
    print(f"Time   : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 62 + "\n")

    connector = aiohttp.TCPConnector(limit=3000, limit_per_host=3000)

    async with aiohttp.ClientSession(connector=connector) as session:
        wake_time = await wake_up(session)
        await warm_up(session)

        token = None
        if TEST_ALL_ENDPOINTS:
            print("---- TAO TAI KHOAN TEST ----")
            token = await setup_test_account(session)
            if not token:
                print("  Khong lay duoc token, chi test GET.\n")
            print()

        all_results = {}

        ep_get = ENDPOINTS["GET_SEATS"]
        steps, broken = await step_load_test(session, ep_get)
        all_results[ep_get["label"]] = {"steps": steps, "broken_at": broken}

        if TEST_ALL_ENDPOINTS and token:
            print(f"\nNghi 10s...\n")
            await asyncio.sleep(10)

            ep_post = ENDPOINTS["POST_BOOKING"]
            steps, broken = await step_load_test(session, ep_post, token)
            all_results[ep_post["label"]] = {"steps": steps, "broken_at": broken}

        print_summary(all_results, wake_time)


await main()
