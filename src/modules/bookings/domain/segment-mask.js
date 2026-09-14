const TOTAL_SEGMENTS = 4;
const FULL_MASK = 15;

const buildSegmentMask = (fromIndex, toIndex) => {
    if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) {
        throw new Error("chỉ số phân đoạn phải là số nguyên");
    };

    if (fromIndex < 0 || fromIndex >= TOTAL_SEGMENTS || toIndex < 0 || toIndex >= TOTAL_SEGMENTS) {
        throw new Error(`chỉ số phân đoạn phải nằm trong khoảng từ 0 đến ${TOTAL_SEGMENTS - 1}`);
    };

    const segmentCount = toIndex - fromIndex;
    if (segmentCount <= 0) {
        throw new Error("chỉ số phân đoạn 'toIndex' phải lớn hơn hoặc bằng 'fromIndex'");
    }

    // tạo bit mask cho các phân đoạn từ 'fromIndex' đến 'toIndex' có giá trị 1, các phân đoạn khác có giá trị 0
    return ((1 << segmentCount) - 1) << fromIndex;

};

// true là trùng, false là không trùng
const hasConflict = (mask1, mask2) => {
    return (mask1 & mask2) !== 0;
};

// tạo mặt nạ để nhả khi hoàn thành chặng đường
const buildClearMask = (segmentMask) => {
    return FULL_MASK ^ segmentMask;
};

module.exports = {
    TOTAL_SEGMENTS,
    FULL_MASK,
    buildSegmentMask,
    hasConflict,
    buildClearMask
};







