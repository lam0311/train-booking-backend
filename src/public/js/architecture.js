const ARCH_LAYERS_DATA = [
    {
        id: 1,
        code: "01",
        name: "Client Interface",
        tag: "EXTERNAL ACTOR",
        title: "TẦNG 01: CLIENT INTERFACE (GIAO DIỆN KHÁCH HÀNG)",
        subtitle: "Cửa ngõ bên ngoài khởi phát yêu cầu và tiếp nhận kết quả",
        role: "Tác nhân khởi phát (Primary Actor). Client đóng gói thông tin đặt vé thành HTTP Request đính kèm JWT Bearer Token để định danh và Header Idempotency-Key (UUID v4) chống gửi trùng giao dịch khi mạng chập chờn.",
        dependencyRule: "Chỉ giao tiếp qua Endpoint công khai (/api/v1/...) và định dạng JSON HTTP. Hoàn toàn không phụ thuộc Database hay thuật toán nội bộ Backend.",
        invariants: "Mỗi lượt bấm thanh toán bắt buộc kèm Idempotency-Key duy nhất. Phản hồi minh bạch mã lỗi HTTP 400, 409, 429.",
        tech: "Browser Fetch API, Swagger UI OpenAPI 3.0, Mobile Client, cURL.",
        inputs: "Thao tác người dùng: tripId, seatNumber, fromIndex, toIndex.",
        outputs: "HTTP Request POST /api/v1/bookings kèm Header Authorization & Idempotency-Key.",
        files: [
            "src/public/index.html",
            "openapi.json",
            "swagger.yaml"
        ],
        codeTitle: "HTTP Client Request Example (Header Idempotency-Key & Bearer Auth)",
        codeLang: "HTTP / REST API",
        codeSnippet: `// 1. Khách hàng gửi yêu cầu đặt vé kèm Header Idempotency-Key
POST /api/v1/bookings HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Idempotency-Key: 7b2f6e91-8c44-42a1-9a70-38e9c394c8de
Content-Type: application/json

{
  "tripId": "SE1-2026",
  "seatNumber": 12,
  "fromIndex": 0,
  "toIndex": 2
}

// 2. HTTP Response 201 Created nhận được sau khi đi qua 5 tầng:
HTTP/1.1 201 Created
Idempotency-Replayed: false
Content-Type: application/json

{
  "status": "success",
  "data": {
    "booking": {
      "bookingId": "8f3a9e22-bb12-4293-8dc9-1d9321e905d4",
      "tripId": "SE1-2026",
      "seatNumber": 12,
      "segmentMask": 3,
      "status": "CONFIRMED"
    },
    "replayed": false
  }
}`
    },
    {
        id: 2,
        code: "02",
        name: "Presentation Layer",
        tag: "INBOUND ADAPTER",
        title: "TẦNG 02: PRESENTATION LAYER (TẦNG GIAO TIẾP // ADAPTER)",
        subtitle: "Tiếp nhận HTTP, định tuyến, phân quyền JWT và kiểm thực Zod",
        role: "Driving Adapter: Tiếp nhận HTTP Request, bóc tách req.body, req.headers, xác thực người dùng qua JWT. Thực thi kiểm thực nghiêm ngặt bằng Zod Schema (fromIndex < toIndex): chặn đứng dữ liệu sai ngay tại cổng ngõ mà không tốn tài nguyên DB.",
        dependencyRule: "Chỉ phụ thuộc Application Layer (gọi Use Case). Không import Domain hay truy cập trực tiếp Mongoose/Redis. Chuyển đổi HTTP Request thành DTO an toàn.",
        invariants: "Toàn bộ dữ liệu vào phải đạt 100% Zod Schema. fromIndex bắt buộc nhỏ hơn toIndex. Token JWT phải hợp lệ và còn hạn.",
        tech: "Express.js 5.x, Zod Schema Validation, Helmet Security, express-rate-limit, CORS.",
        inputs: "Express Request Object (req.body, req.query, req.headers, req.auth).",
        outputs: "Validated Command DTO ({ tripId, seatNumber, fromIndex, toIndex, userId, idempotencyKey }).",
        files: [
            "src/modules/bookings/presentation/booking.controller.js",
            "src/modules/bookings/presentation/booking.routes.js",
            "src/modules/bookings/presentation/booking.schema.js",
            "src/shared/presentation/auth.middleware.js"
        ],
        codeTitle: "src/modules/bookings/presentation/booking.controller.js & booking.schema.js",
        codeLang: "JavaScript (Express Controller & Zod Schema)",
        codeSnippet: `// 1. Kiểm thực Schema đầu vào bằng Zod
const bookingSchema = z.object({
    tripId: z.string().trim().min(1).max(120),
    seatNumber: z.coerce.number().int().min(1).max(1000),
    fromIndex: z.coerce.number().int().min(0).max(3),
    toIndex: z.coerce.number().int().min(1).max(4)
}).refine(data => data.fromIndex < data.toIndex, {
    message: "toIndex bắt buộc phải lớn hơn fromIndex",
    path: ["toIndex"]
});

// 2. Controller xử lý và chuyển giao lời gọi xuống Use Case
class BookingController {
    createBooking = async (req, res, next) => {
        try {
            const { tripId, seatNumber, fromIndex, toIndex } = req.body;
            const idempotencyKey = req.headers["idempotency-key"];

            const result = await this.createBookingUseCase.execute({
                tripId,
                seatNumber: Number(seatNumber),
                fromIndex: Number(fromIndex),
                toIndex: Number(toIndex),
                userId: req.auth?.userId,
                idempotencyKey
            });

            res.setHeader("Idempotency-Replayed", result.replayed ? "true" : "false");
            return res.status(201).json({ data: result });
        } catch (error) {
            next(error);
        }
    };
}`
    },
    {
        id: 3,
        code: "03",
        name: "Application Layer",
        tag: "USE CASE CORE",
        title: "TẦNG 03: APPLICATION LAYER (ĐIỀU PHỐI NGHIỆP VỤ)",
        subtitle: "Bộ não điều phối Use Case, chống lặp Idempotency và giao dịch",
        role: "Orchestrator: Thực thi các kịch bản Use Case, kiểm soát tính bất biến giao dịch qua thuật toán băm SHA-256 Fingerprint (chống bấm đúp trừ tiền hai lần), sinh mã vé UUID v4, gọi Domain tính Bitmask và điều phối Repository lưu dữ liệu.",
        dependencyRule: "Phụ thuộc vào Domain Layer và định nghĩa các Port (Interface Repository). Không phụ thuộc Express (không dùng req, res) và không phụ thuộc công nghệ cơ sở dữ liệu cụ thể (DIP).",
        invariants: "Cùng một Idempotency-Key không được sinh 2 vé khác nhau. Nếu cùng key nhưng đổi tham số vé -> chặn ngay lỗi 409 IDEMPOTENCY_CONFLICT.",
        tech: "Node.js Crypto (SHA-256 Hash, Random UUID), Custom AppError Domain.",
        inputs: "Command Payload ({ tripId, seatNumber, fromIndex, toIndex, userId, idempotencyKey }).",
        outputs: "Booking Entity Result ({ booking: { bookingId, tripId, seatNumber, fromIndex, toIndex, segmentMask }, replayed }).",
        files: [
            "src/modules/bookings/application/create-booking.use-case.js",
            "src/modules/bookings/application/get-seats.use-case.js",
            "src/modules/bookings/application/delete-booking.use-case.js"
        ],
        codeTitle: "src/modules/bookings/application/create-booking.use-case.js",
        codeLang: "JavaScript (Application Use Case)",
        codeSnippet: `class CreateBookingUsecase {
    execute = async ({ tripId, seatNumber, fromIndex, toIndex, userId, idempotencyKey }) => {
        // 1. Tạo dấu vân tay (Fingerprint) của giao dịch đặt vé
        const fingerprint = crypto.createHash("sha256")
            .update(JSON.stringify({ tripId, seatNumber, fromIndex, toIndex }))
            .digest("hex");

        let requestId;
        // 2. Đối soát Idempotency chống bấm đúp khi mạng lag
        if (idempotencyKey) {
            requestId = crypto.createHash("sha256")
                .update(JSON.stringify({ userId, idempotencyKey }))
                .digest("hex");

            const previous = await this.seatInventoryRepository.findByRequestId(requestId);
            if (previous) {
                if (previous.fingerprint !== fingerprint) {
                    throw new AppError("IDEMPOTENCY_CONFLICT", "Key đã dùng cho vé khác!", 409);
                }
                return { booking: previous, replayed: true };
            }
        }

        // 3. Gọi hàm Domain tính toán bitmask thuần túy
        const segmentMask = buildSegmentMask(fromIndex, toIndex);
        const bookingId = crypto.randomUUID();

        // 4. Ghi dữ liệu nguyên tử xuống tầng Infrastructure
        const updateSeat = await this.seatInventoryRepository.allocate({
            tripId, seatNumber,
            allocation: { bookingId, userId, fromIndex, toIndex, segmentMask, requestId, fingerprint }
        });

        if (!updateSeat) {
            throw new AppError("SEGMENT_CONFLICT", "Ghế đã có người đặt ở chặng này!", 409);
        }

        return { booking: { bookingId, tripId, seatNumber, fromIndex, toIndex, status: "CONFIRMED" }, replayed: false };
    };
}`
    },
    {
        id: 4,
        code: "04",
        name: "Domain Layer // Core",
        tag: "TẦNG NGHIỆP VỤ CỐT LÕI",
        title: "TẦNG 04: DOMAIN LAYER (NGHIỆP VỤ CỐT LÕI // CORE)",
        subtitle: "Trung tâm hệ thống: Thuật toán Bitmask xử lý phân bổ chặng vé",
        role: "Chuyển bài toán phân bổ ghế liên trạm thành các phép toán nhị phân trên mặt nạ bit. Tầng này thuần khiết (Pure Functions, không phụ thuộc thư viện ngoài), thực hiện kiểm tra và tạo mặt nạ chặng tức thì.",
        dependencyRule: "Độc lập tuyệt đối! Không phụ thuộc vào bất kỳ tầng nào khác (Zero Outward Dependencies). Mọi tầng ngoài đều phụ thuộc vào Domain Core.",
        invariants: "Toàn bộ 4 phân đoạn hành trình nằm gọn trong 4 bit (giá trị 0 đến 15). Không tồn tại trạng thái bitmask âm hoặc vượt quá 15.",
        tech: "Bitwise Operators (<<, &, ^, |), Xử lý bit nhị phân, Pure Functions.",
        inputs: "Chỉ số trạm dừng: fromIndex (0..3), toIndex (1..4), occupiedMask (0..15).",
        outputs: "segmentMask (0..15), clearMask (0..15), hasConflict (boolean true/false).",
        files: [
            "src/modules/bookings/domain/segment-mask.js",
            "src/shared/domain/app-error.js"
        ],
        codeTitle: "src/modules/bookings/domain/segment-mask.js",
        codeLang: "JavaScript (Pure Domain Logic - Zero Dependencies)",
        codeSnippet: `const TOTAL_SEGMENTS = 4;
const FULL_MASK = 15; // 0b1111 (Kín cả 4 phân đoạn hành trình)

/**
 * Thuật toán tạo mặt nạ chặng: ((1 << count) - 1) << fromIndex
 * Ví dụ: Ga 0 -> 2: count = 2.
 * (1 << 2) - 1 = 3 (0b0011). 3 << 0 = 3 (0b0011).
 */
const buildSegmentMask = (fromIndex, toIndex) => {
    if (fromIndex < 0 || toIndex > TOTAL_SEGMENTS || fromIndex >= toIndex) {
        throw new Error("Chỉ số ga không hợp lệ");
    }
    const segmentCount = toIndex - fromIndex;
    return ((1 << segmentCount) - 1) << fromIndex;
};

/**
 * Kiểm tra xung đột logic chặng: Phép toán AND bitwise tức thì
 */
const hasConflict = (mask1, mask2) => {
    return (mask1 & mask2) !== 0;
};

/**
 * Tạo mặt nạ nhả ghế bằng phép XOR với mặt nạ toàn thể (FULL_MASK)
 */
const buildClearMask = (segmentMask) => {
    return FULL_MASK ^ segmentMask;
};

module.exports = { buildSegmentMask, hasConflict, buildClearMask };`
    },
    {
        id: 5,
        code: "05",
        name: "Infrastructure Layer",
        tag: "OUTBOUND ADAPTER",
        title: "TẦNG 05: INFRASTRUCTURE LAYER (HẠ TẦNG & LƯU TRỮ)",
        subtitle: "Cơ sở dữ liệu MongoDB $bitsAllClear, Redis L2, RAM L1",
        role: "Hiện thực hóa Repository Interface do Application yêu cầu. Sử dụng toán tử nguyên tử $bitsAllClear và $bit: { or } của MongoDB để xử lý đặt vé đồng thời, loại bỏ triệt để Race Condition mà không cần cơ chế khóa phân tán phức tạp. Quản lý Cache 2 tầng và Request Coalescing.",
        dependencyRule: "Hiện thực Interface Repository do Application định nghĩa. Mọi chi tiết về MongoDB, Redis, Mongoose đều cô lập tại đây, dễ dàng thay thế mà không sửa code Domain/Application.",
        invariants: "Chỉ cập nhật thành công nếu tất cả bit trong segmentMask đang ở trạng thái 0 ($bitsAllClear Atomic Condition).",
        tech: "MongoDB Driver (Mongoose), Redis (ioredis), LocalCache Map (RAM L1 2s), jsonwebtoken, bcryptjs.",
        inputs: "Query / Update Specifications từ tầng Application (tripId, seatNumber, allocation).",
        outputs: "Persistent Document MongoDB / Cached Memory JSON / Atomic Execution Result.",
        files: [
            "src/modules/bookings/infrastructure/mongoose-seat-inventory.repository.js",
            "src/modules/bookings/infrastructure/seat-inventory.model.js",
            "src/config/redis.js",
            "src/shared/infrastructure/local-cache.js",
            "src/shared/infrastructure/jwt.js"
        ],
        codeTitle: "src/modules/bookings/infrastructure/mongoose-seat-inventory.repository.js",
        codeLang: "JavaScript (Mongoose Atomic Operations & Cache Invalidation)",
        codeSnippet: `// 1. Thao tác đặt vé nguyên tử chống Race Condition cấp độ Database Engine
allocate = async ({ tripId, seatNumber, allocation }) => {
    const updateSeat = await SeatInventory.findOneAndUpdate(
        {
            tripId,
            seatNumber,
            // ĐIỀU KIỆN NGUYÊN TỬ: Các bit của chặng bắt buộc phải đang BẰNG 0
            occupiedMask: { $bitsAllClear: allocation.segmentMask }
        },
        {
            // CẬP NHẬT NGUYÊN TỬ: Bật các bit của chặng lên 1
            $bit: { occupiedMask: { or: allocation.segmentMask } },
            $push: { allocations: allocation }
        },
        { new: true }
    ).lean();

    // Tự động xóa sạch Cache L1 và L2 khi trạng thái ghế thay đổi
    if (updateSeat) {
        await this.invalidateTripCache(tripId);
    }
    return updateSeat;
};

// 2. Kỹ thuật Request Coalescing chống Thundering Herd
findSeatByTrip = async (tripId) => {
    const cacheKey = \`seats:\${tripId}\`;
    const localSeats = LocalCache.get(cacheKey);
    if (localSeats) return localSeats;

    const existingLoad = inFlightLoads.get(cacheKey);
    if (existingLoad) return existingLoad;

    const loadPromise = this.loadSeatsFromLowerCache(tripId, cacheKey);
    inFlightLoads.set(cacheKey, loadPromise);
    try {
        return await loadPromise;
    } finally {
        inFlightLoads.delete(cacheKey);
    }
};`
    }
];

const TRACE_STEPS = [
    {
        layerId: 1,
        title: "BƯỚC 1/6: CLIENT GỬI HTTP REQUEST",
        desc: "Khách hàng gửi POST /api/v1/bookings chặng Hà Nội -> Vinh (Ga 0 -> 2) ghế 12 kèm Bearer Token và Idempotency-Key.",
        packetType: "HTTP REQUEST PAYLOAD (CLIENT -> GATEWAY)",
        packetData: `POST /api/v1/bookings HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Idempotency-Key: 7b2f6e91-8c44-42a1-9a70-38e9c394c8de
Content-Type: application/json

{
  "tripId": "SE1-2026",
  "seatNumber": 12,
  "fromIndex": 0,
  "toIndex": 2
}`
    },
    {
        layerId: 2,
        title: "BƯỚC 2/6: PRESENTATION KIỂM THỰC ZOD SCHEMA",
        desc: "Router tiếp nhận, Auth giải mã JWT lấy userId. Zod Schema thẩm định kiểu dữ liệu và fromIndex (0) < toIndex (2). Chặn đứng request sai ngay cửa ngõ.",
        packetType: "VALIDATED COMMAND DTO (CONTROLLER -> APPLICATION)",
        packetData: `{
  tripId: "SE1-2026",
  seatNumber: 12,
  fromIndex: 0,
  toIndex: 2,
  userId: "usr_68df3a992",
  idempotencyKey: "7b2f6e91-8c44-42a1-9a70-38e9c394c8de"
}`
    },
    {
        layerId: 3,
        title: "BƯỚC 3/6: APPLICATION ĐIỀU PHỐI & CHỐNG LẶP",
        desc: "Tính SHA-256 Fingerprint kiểm tra bảng Idempotency chống trừ tiền 2 lần khi mạng lag. Sinh mã vé UUID v4 ngẫu nhiên.",
        packetType: "ORCHESTRATION CONTEXT & SHA-256 FINGERPRINT",
        packetData: `requestId: "sha256(userId + idempotencyKey)",
fingerprint: "sha256(SE1-2026 + seat:12 + from:0 + to:2)",
bookingId: "c4a921d7-21a4-4f88-9d41-3b791e2b5c01",
status: "ALLOCATING"`
    },
    {
        layerId: 4,
        title: "BƯỚC 4/6: DOMAIN THỰC THI THUẬT TOÁN BITMASK",
        desc: "Hàm thuần túy buildSegmentMask(0, 2) thực thi ((1 << 2) - 1) << 0 = 3 (0b0011) bằng phép toán bit tức thì, không có độ trễ I/O.",
        packetType: "DOMAIN BITMASK COMPUTATION",
        packetData: `count = toIndex (2) - fromIndex (0) = 2
mask = ((1 << 2) - 1) << 0 = 3 (Nhị phân: 0b0011)
Ý nghĩa: Chiếm giữ Phân đoạn 0 (Hà Nội -> Nam Định) và Phân đoạn 1 (Nam Định -> Vinh)
Thời gian tính toán: Tức thì (Toán tử bit)`
    },
    {
        layerId: 5,
        title: "BƯỚC 5/6: INFRASTRUCTURE ATOMIC MONGODB & CACHE",
        desc: "MongoDB thực thi findOneAndUpdate với occupiedMask: { $bitsAllClear: 3 } và $bit: { or: 3 }. Khóa mức document nguyên tử, xóa Cache L1/L2.",
        packetType: "ATOMIC DATABASE COMMAND & CACHE INVALIDATION",
        packetData: `db.seat_inventories.findOneAndUpdate(
  {
    tripId: "SE1-2026",
    seatNumber: 12,
    occupiedMask: { $bitsAllClear: 3 } // ĐIỀU KIỆN: Bit 0 và 1 phải bằng 0
  },
  {
    $bit: { occupiedMask: { or: 3 } }, // CẬP NHẬT: Lật bit 0 và 1 lên 1
    $push: { allocations: { bookingId, fromIndex: 0, toIndex: 2, segmentMask: 3 } }
  },
  { new: true }
);
// Invalidate RAM Cache L1 (2s) và Redis Cache L2 (60s) cho chuyến tàu SE1-2026!`
    },
    {
        layerId: 1,
        title: "BƯỚC 6/6: TRẢ PHẢN HỒI HTTP 201 CHO KHÁCH HÀNG",
        desc: "Đóng gói kết quả trả về HTTP 201 Created. Trình duyệt nhận mã vé xác nhận, hiển thị trạng thái hoàn tất và cập nhật sơ đồ ghế.",
        packetType: "HTTP 201 CREATED RESPONSE (GATEWAY -> CLIENT)",
        packetData: `HTTP/1.1 201 Created
Content-Type: application/json
Idempotency-Replayed: false

{
  "status": "success",
  "data": {
    "booking": {
      "bookingId": "c4a921d7-21a4-4f88-9d41-3b791e2b5c01",
      "tripId": "SE1-2026",
      "seatNumber": 12,
      "fromIndex": 0,
      "toIndex": 2,
      "segmentMask": 3,
      "status": "CONFIRMED"
    },
    "replayed": false
  }
}`
    }
];

let currentActiveLayer = 4; // Mặc định là Tầng 04 (Domain Core)
let currentStepIndex = 0;
let isAutoPlaying = false;
let autoPlayTimer = null;
let currentInspectorTab = "overview"; // "overview" | "code" | "packet"
const STEP_DURATION_MS = 3500; // 3.5s/bước để kịp đọc

function switchInspectorTab(tabName) {
    currentInspectorTab = tabName;

    const btnOverview = document.getElementById("tabBtnOverview");
    const btnCode = document.getElementById("tabBtnCode");
    const btnPacket = document.getElementById("tabBtnPacket");

    const viewOverview = document.getElementById("inspectorViewOverview");
    const viewCode = document.getElementById("inspectorViewCode");
    const viewPacket = document.getElementById("inspectorViewPacket");

    const activeClasses = "bg-cyan-500/20 text-cyan-300 border-cyan-500";
    const inactiveClasses = "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200";

    [btnOverview, btnCode, btnPacket].forEach(btn => {
        if (!btn) return;
        btn.className = `px-3 py-1 rounded text-xs font-mono font-bold border transition ${inactiveClasses}`;
    });

    if (viewOverview) viewOverview.classList.add("hidden");
    if (viewCode) viewCode.classList.add("hidden");
    if (viewPacket) viewPacket.classList.add("hidden");

    if (tabName === "overview") {
        if (btnOverview) btnOverview.className = `px-3 py-1 rounded text-xs font-mono font-bold border transition ${activeClasses}`;
        if (viewOverview) viewOverview.classList.remove("hidden");
    } else if (tabName === "code") {
        if (btnCode) btnCode.className = `px-3 py-1 rounded text-xs font-mono font-bold border transition ${activeClasses}`;
        if (viewCode) viewCode.classList.remove("hidden");
    } else if (tabName === "packet") {
        if (btnPacket) btnPacket.className = `px-3 py-1 rounded text-xs font-mono font-bold border transition ${activeClasses}`;
        if (viewPacket) viewPacket.classList.remove("hidden");
    }
}

function selectLayer(layerId) {
    currentActiveLayer = layerId;
    const data = ARCH_LAYERS_DATA.find(l => l.id === layerId) || ARCH_LAYERS_DATA[3];

    // Cập nhật trạng thái hiển thị của các node trong cây
    for (let i = 1; i <= 5; i++) {
        const node = document.getElementById(`treeNode_${i}`);
        const badge = document.getElementById(`treeNodeBadge_${i}`);

        if (node) {
            if (i === layerId) {
                node.className = "tree-node p-2.5 rounded-lg border border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(56,189,248,0.2)] flex items-center justify-between cursor-pointer transition text-left";
                if (badge) badge.className = "w-6 h-6 rounded bg-cyan-500 text-slate-950 text-[11px] font-mono font-bold flex items-center justify-center";
            } else {
                node.className = "tree-node p-2.5 rounded-lg border border-slate-800/90 bg-slate-900/50 hover:border-slate-700 flex items-center justify-between cursor-pointer transition text-left";
                if (badge) badge.className = "w-6 h-6 rounded bg-slate-800 text-[11px] font-mono font-bold flex items-center justify-center text-slate-400";
            }
        }
    }

    // Cập nhật header của inspector
    const titleEl = document.getElementById("activeLayerTitle");
    const tagEl = document.getElementById("activeLayerTag");
    const roleEl = document.getElementById("activeLayerRole");
    const depRuleEl = document.getElementById("activeLayerDepRule");
    const invariantsEl = document.getElementById("activeLayerInvariants");
    const techEl = document.getElementById("activeLayerTech");
    const inOutEl = document.getElementById("activeLayerInOut");
    const filesEl = document.getElementById("activeLayerFiles");
    const codeTitleEl = document.getElementById("activeLayerCodeTitle");
    const codeLangEl = document.getElementById("activeLayerCodeLang");
    const codePreEl = document.getElementById("activeLayerCodePre");

    if (titleEl) titleEl.innerText = data.title;
    if (tagEl) tagEl.innerText = data.tag;
    if (roleEl) roleEl.innerText = data.role;
    if (depRuleEl) depRuleEl.innerText = data.dependencyRule;
    if (invariantsEl) invariantsEl.innerText = data.invariants;
    if (techEl) techEl.innerText = data.tech;

    if (inOutEl) {
        inOutEl.innerHTML = `
            <div><span class="text-slate-500 font-semibold uppercase">INPUT:</span> <span class="text-slate-300">${data.inputs}</span></div>
            <div class="mt-1"><span class="text-slate-500 font-semibold uppercase">OUTPUT:</span> <span class="text-emerald-400">${data.outputs}</span></div>
        `;
    }

    if (filesEl) {
        filesEl.innerHTML = data.files.map(f => `<span class="px-2 py-0.5 rounded bg-slate-950 text-cyan-300 font-mono text-[10px] border border-slate-800">${f}</span>`).join(" ");
    }

    if (codeTitleEl) codeTitleEl.innerText = data.codeTitle;
    if (codeLangEl) codeLangEl.innerText = data.codeLang;
    if (codePreEl) codePreEl.innerText = data.codeSnippet;
}

function displayTraceStep(stepIdx) {
    if (stepIdx < 0 || stepIdx >= TRACE_STEPS.length) return;
    currentStepIndex = stepIdx;
    const s = TRACE_STEPS[stepIdx];

    // Làm nổi bật tầng tương ứng
    selectLayer(s.layerId);

    // Cập nhật text bước và packet
    const stepCountEl = document.getElementById("pipelineTraceStepCount");
    const statusMsgEl = document.getElementById("pipelineTraceStatusMsg");
    const packetTypeEl = document.getElementById("pipelineTracePacketType");
    const packetDataEl = document.getElementById("pipelineTracePacketData");
    const progressBarEl = document.getElementById("pipelineTraceProgressBar");

    if (stepCountEl) stepCountEl.innerText = s.title;
    if (statusMsgEl) statusMsgEl.innerText = s.desc;
    if (packetTypeEl) packetTypeEl.innerText = s.packetType;
    if (packetDataEl) packetDataEl.innerText = s.packetData;

    if (progressBarEl) {
        const percent = ((stepIdx + 1) / TRACE_STEPS.length) * 100;
        progressBarEl.style.width = `${percent}%`;
    }

    // Hiệu ứng vòng sáng chạy qua node cây
    for (let i = 1; i <= 5; i++) {
        const node = document.getElementById(`treeNode_${i}`);
        if (node) {
            if (i === s.layerId) {
                node.classList.add("ring-2", "ring-cyan-400");
            } else {
                node.classList.remove("ring-2", "ring-cyan-400");
            }
        }
    }
}

function startAutoTrace() {
    if (isAutoPlaying) {
        pauseTrace();
        return;
    }

    isAutoPlaying = true;
    const playBtn = document.getElementById("tracePlayPauseBtn");
    if (playBtn) playBtn.innerText = "TẠM DỪNG";

    if (currentStepIndex >= TRACE_STEPS.length - 1) {
        currentStepIndex = 0;
    }

    displayTraceStep(currentStepIndex);

    clearInterval(autoPlayTimer);
    autoPlayTimer = setInterval(() => {
        if (currentStepIndex < TRACE_STEPS.length - 1) {
            currentStepIndex++;
            displayTraceStep(currentStepIndex);
        } else {
            pauseTrace();
        }
    }, STEP_DURATION_MS);
}

function pauseTrace() {
    isAutoPlaying = false;
    clearInterval(autoPlayTimer);
    autoPlayTimer = null;
    const playBtn = document.getElementById("tracePlayPauseBtn");
    if (playBtn) playBtn.innerText = "TIẾP TỤC";
}

function nextTraceStep() {
    pauseTrace();
    if (currentStepIndex < TRACE_STEPS.length - 1) {
        currentStepIndex++;
        displayTraceStep(currentStepIndex);
    }
}

function prevTraceStep() {
    pauseTrace();
    if (currentStepIndex > 0) {
        currentStepIndex--;
        displayTraceStep(currentStepIndex);
    }
}

function resetTrace() {
    pauseTrace();
    currentStepIndex = 0;
    displayTraceStep(0);
    const playBtn = document.getElementById("tracePlayPauseBtn");
    if (playBtn) playBtn.innerText = "CHẠY TỰ ĐỘNG";
}

function runRequestPipelineTrace() {
    resetTrace();
    startAutoTrace();
}
