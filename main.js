window.addEventListener("gesturechange", e => {e.preventDefault()}, {passive: false})
window.addEventListener("gesturestart", e => {e.preventDefault()}, {passive: false})
window.addEventListener("gestureend", e => {e.preventDefault()}, {passive: false})

let lastTouchTime = 0;
const DOUBLE_TAP_DELAY = 300;

document.addEventListener(
	"touchstart",
	(e) => {
		const now = performance.now();

		if (now - lastTouchTime < DOUBLE_TAP_DELAY) {
			e.preventDefault(); // stops double-tap zoom
		}

		lastTouchTime = now;
	},
	{ passive: false }
);

const AppState = {
	selection_type : null,
	selection : null,
	samples : [],
	samplers : [],
	audioContext : new AudioContext()
}


function clearInspectorGui() {
	document.getElementById("inspector").innerHTML = "";
}

function crash(message) {
	document.body.innerHTML = message;
}





