class LocalCache {
    constructor() {
        this.store = new Map();
    }

    get(key) {
        const entry = this.store.get(key);

        if (!entry) {
            return null;
        }

        if (entry.expiresAt <= Date.now()) {
            this.store.delete(key);
            return null;
        }

        return entry.value;
    }

    set(key, value, ttlMs) {
        this.store.set(key, {
            value,
            expiresAt: Date.now() + ttlMs
        });
    }

    setKey(key, value, ttlMs) {
        this.set(key, value, ttlMs);
    }

    delete(key) {
        this.store.delete(key);
    }
}

module.exports = new LocalCache;

