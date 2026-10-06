const mongoose = require("mongoose");

const { Schema } = mongoose;

const allocationSchema = new Schema({
    bookingId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    fromIndex: {
        type: Number,
        required: true
    },
    toIndex: {
        type: Number,
        required: true
    },
    segmentMask: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    requestId: { // nhận diện yêu cầu dùng để tránh trùng lặp khi retry
        type: String,
        default: null
    },
    fingerprint: { // nhận diện thông tin đặt vé tránh trùng lặp khi retry
        type: String,
        default: null
    }
},
    { _id: false }
);

const seatInventorySchema = new Schema({
    tripId: { type: String, required: true },
    seatNumber: { type: Number, required: true },
    occupiedMask: { type: Number, default: 0, min: 0, max: 15 },
    allocations: { type: [allocationSchema], default: [] },
},
    { timestamps: true }
);


seatInventorySchema.index({ tripId: 1, seatNumber: 1 }, { unique: true });

seatInventorySchema.index({
    "allocations.bookingId": 1,
    "allocations.userId": 1,
});

seatInventorySchema.index({ "allocations.requestId": 1 }, { sparse: true });

const SeatInventory = mongoose.model("SeatInventory", seatInventorySchema, "seat_inventories");

module.exports = SeatInventory;


