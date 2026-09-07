document.addEventListener("DOMContentLoaded", () => {
    const triggers = document.querySelectorAll(
        ".zoom-image, .fullscreen-image-button"
    );

    let overlay = null;
    let fullscreenImage = null;
    let closeButton = null;

    let zoom = 1;
    let x = 0;
    let y = 0;

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startOffsetX = 0;
    let startOffsetY = 0;

    function createLightbox() {
        if (overlay) return;

        overlay = document.createElement("div");
        overlay.className = "image-lightbox";

        closeButton = document.createElement("button");
        closeButton.className = "lightbox-close";
        closeButton.innerHTML = "&times;";
        closeButton.setAttribute("aria-label", "Close image");

        fullscreenImage = document.createElement("img");
        fullscreenImage.className = "lightbox-image";

        overlay.appendChild(closeButton);
        overlay.appendChild(fullscreenImage);
        document.body.appendChild(overlay);

        closeButton.addEventListener("click", (e) => {
            e.stopPropagation();
            closeLightbox();
        });

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                closeLightbox();
            }
        });

        fullscreenImage.addEventListener("wheel", handleWheel, {
            passive: false
        });

        fullscreenImage.addEventListener("pointerdown", handlePointerDown);
        fullscreenImage.addEventListener("pointermove", handlePointerMove);
        fullscreenImage.addEventListener("pointerup", handlePointerUp);
        fullscreenImage.addEventListener("pointercancel", handlePointerUp);
    }

    function openLightbox(sourceImage) {
        createLightbox();

        fullscreenImage.src =
            sourceImage.currentSrc || sourceImage.src;

        fullscreenImage.alt =
            sourceImage.alt || "Full-size image";

        zoom = 1;
        x = 0;
        y = 0;

        applyTransform();

        overlay.hidden = false;
        overlay.style.display = "flex";

        document.body.classList.add("lightbox-open");

        // Prevent the main page from scrolling
        document.body.style.overflow = "hidden";

        fullscreenImage.style.cursor = "grab";
    }

    function closeLightbox() {
        if (!overlay) return;

        overlay.hidden = true;
        overlay.style.display = "none";

        document.body.classList.remove("lightbox-open");
        document.body.style.overflow = "";

        dragging = false;
    }

    function applyTransform() {
        fullscreenImage.style.transform =
            `translate3d(${x}px, ${y}px, 0) scale(${zoom})`;

        fullscreenImage.style.cursor =
            zoom > 1
                ? (dragging ? "grabbing" : "grab")
                : "zoom-in";
    }

    function getBounds() {
        const imageWidth = fullscreenImage.offsetWidth;
        const imageHeight = fullscreenImage.offsetHeight;

        const viewportWidth = overlay.clientWidth;
        const viewportHeight = overlay.clientHeight;

        /*
         * How far the image can be moved from the center.
         *
         * Example:
         * Image = 2000px wide
         * Viewport = 1000px wide
         *
         * At scale 2:
         * Image becomes 4000px
         *
         * So it can move roughly:
         * (4000 - 1000) / 2 = 1500px
         */
        const scaledWidth = imageWidth * zoom;
        const scaledHeight = imageHeight * zoom;

        const maxX = Math.max(
            0,
            (scaledWidth - viewportWidth) / 2
        );

        const maxY = Math.max(
            0,
            (scaledHeight - viewportHeight) / 2
        );

        return {
            maxX,
            maxY
        };
    }

    function clampPosition() {
        const bounds = getBounds();

        x = Math.max(
            -bounds.maxX,
            Math.min(x, bounds.maxX)
        );

        y = Math.max(
            -bounds.maxY,
            Math.min(y, bounds.maxY)
        );
    }

    function handleWheel(event) {
        event.preventDefault();
        event.stopPropagation();

        const rect = fullscreenImage.getBoundingClientRect();

        // Mouse position relative to image center
        const mouseX =
            event.clientX -
            (rect.left + rect.width / 2);

        const mouseY =
            event.clientY -
            (rect.top + rect.height / 2);

        const oldZoom = zoom;

        /*
         * Smooth zoom.
         */
        if (event.deltaY < 0) {
            zoom *= 1.15;
        } else {
            zoom /= 1.15;
        }

        zoom = Math.max(
            1,
            Math.min(zoom, 8)
        );

        /*
         * Keep the point underneath the mouse
         * in approximately the same location.
         */
        const scale = zoom / oldZoom;

        x = mouseX - (mouseX - x) * scale;
        y = mouseY - (mouseY - y) * scale;

        if (zoom === 1) {
            x = 0;
            y = 0;
        }

        clampPosition();
        applyTransform();
    }

    function handlePointerDown(event) {
        if (zoom <= 1) {
            return;
        }

        event.preventDefault();

        dragging = true;

        startX = event.clientX;
        startY = event.clientY;

        startOffsetX = x;
        startOffsetY = y;

        fullscreenImage.setPointerCapture(
            event.pointerId
        );

        fullscreenImage.style.cursor = "grabbing";
    }

    function handlePointerMove(event) {
        if (!dragging) {
            return;
        }

        event.preventDefault();

        const dx =
            event.clientX - startX;

        const dy =
            event.clientY - startY;

        x = startOffsetX + dx;
        y = startOffsetY + dy;

        clampPosition();
        applyTransform();
    }

    function handlePointerUp(event) {
        if (!dragging) {
            return;
        }

        dragging = false;

        if (
            fullscreenImage.hasPointerCapture(
                event.pointerId
            )
        ) {
            fullscreenImage.releasePointerCapture(
                event.pointerId
            );
        }

        applyTransform();
    }

    /*
     * Keyboard controls
     */
    document.addEventListener("keydown", (event) => {
        if (!overlay || overlay.hidden) {
            return;
        }

        if (event.key === "Escape") {
            closeLightbox();
        }

        if (event.key === "+" || event.key === "=") {
            zoom = Math.min(zoom * 1.2, 8);
            clampPosition();
            applyTransform();
        }

        if (event.key === "-") {
            zoom = Math.max(zoom / 1.2, 1);

            if (zoom === 1) {
                x = 0;
                y = 0;
            }

            clampPosition();
            applyTransform();
        }
    });

    /*
     * Recalculate boundaries when the browser window
     * changes size.
     */
    window.addEventListener("resize", () => {
        if (!overlay || overlay.hidden) {
            return;
        }

        clampPosition();
        applyTransform();
    });

    /*
     * Attach opening behavior.
     */
    triggers.forEach((trigger) => {
        const image =
            trigger.tagName === "IMG"
                ? trigger
                : trigger.querySelector("img");

        if (!image) {
            return;
        }

        trigger.style.cursor = "zoom-in";

        trigger.addEventListener("click", (event) => {
            event.preventDefault();
            openLightbox(image);
        });
    });
});