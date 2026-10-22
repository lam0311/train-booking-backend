function switchTab(name, event) {
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-btn").forEach(b => {
        b.classList.remove("active", "border-cyan-500", "text-cyan-400", "bg-slate-900");
        b.classList.add("text-slate-400");
    });

    const targetTab = document.getElementById("tab-" + name);
    if (targetTab) {
        targetTab.classList.add("active");
    }

    if (event && event.currentTarget) {
        event.currentTarget.classList.add("active", "border-cyan-500", "text-cyan-400", "bg-slate-900");
        event.currentTarget.classList.remove("text-slate-400");
    }

    if (name === "build" && typeof updateMask === "function") updateMask();
    if (name === "conflict" && typeof updateConflict === "function") updateConflict();
    if (name === "cancel" && typeof updateCancel === "function") updateCancel();
}

function setupNavbar() {
    let lastScroll = 0;
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    window.addEventListener("scroll", () => {
        const curr = window.scrollY;
        if (curr > lastScroll && curr > 100) {
            navbar.style.transform = "translateY(-100%)";
        } else {
            navbar.style.transform = "translateY(0)";
        }
        lastScroll = curr;

        const sections = document.querySelectorAll("section[id]");
        sections.forEach(sec => {
            const top = sec.offsetTop - 140;
            const id = sec.getAttribute("id");
            const link = document.querySelector(`.nav-links a[href="#${id}"]`);
            if (link) {
                if (curr >= top && curr < top + sec.offsetHeight) {
                    link.classList.add("text-cyan-400", "border-b-2", "border-cyan-400");
                    link.classList.remove("text-slate-400");
                } else {
                    link.classList.remove("text-cyan-400", "border-b-2", "border-cyan-400");
                    link.classList.add("text-slate-400");
                }
            }
        });
    });
}

function setupScrollReveal() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("opacity-100", "translate-y-0");
                entry.target.classList.remove("opacity-0", "translate-y-6");
            }
        });
    }, {
        threshold: 0.08
    });

    document.querySelectorAll(".reveal").forEach(el => {
        el.classList.add("transition-all", "duration-500", "ease-out", "opacity-0", "translate-y-6");
        observer.observe(el);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    setupNavbar();
    setupScrollReveal();

    if (typeof updateMask === "function") updateMask();
    if (typeof initSeats === "function") initSeats();
    if (typeof updateConflict === "function") updateConflict();
    if (typeof updateCancel === "function") updateCancel();
    if (typeof selectLayer === "function") selectLayer(4);

    if (typeof handleApiConsoleEndpointChange === "function") {
        handleApiConsoleEndpointChange();
    }
});
