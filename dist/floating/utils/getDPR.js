export function getDPR(element) {
    if (typeof window === "undefined") {
        return 1;
    }
    const win = element.ownerDocument.defaultView || window;
    return win.devicePixelRatio || 1;
}
