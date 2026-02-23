const keysDown = new Set();

window.addEventListener('keydown', (event) => {
    const key = event.key;

    // ignore repeats
    if (keysDown.has(key)) return;
    keysDown.add(key);

    if (key >= '0' && key <= '9') {
        const index = parseInt(key, 10);
        if (AppState.samplers[index]) {
            AppState.samplers[index].trigger();
        }
    }
});




        window.addEventListener('keyup', (event) => {
            keysDown.delete(event.key);
        // event.key will be '0', '1', ..., '9'
        const key = event.key;
        if (key >= '0' && key <= '9') {
            const index = parseInt(key, 10); // convert string to number
            if (AppState.samplers[index-1]) {
                AppState.samplers[index-1].release();
            }
        }
        });


class Sampler {
    constructor() {
        AppState.samplers.push(this);

        this.sampleId = 0;
        this.startOffset = 0;
        this.attack_ms = 5;
        this.decay_ms = 50;
        this.sustain_vol = 0;
        this.speed = 1;
        this.release_ms = 15;

        this.source = null;
        this.graphLength = 300;
        this.gainNode = null;
        this.inspector = new SamplerInspectorGui(this);

        // create the visual element representing the sampler, which can be
        // tapped by the user to play the sound and select the sampler for
        // inspection / editing
        let div = document.createElement("div");
        this.div = div;
        document.getElementById("samplers-list").appendChild(div);
        this.drawWaveform();
        div.className = 'sampler-pad'
        div.style.margin = "0px";




        div.addEventListener("pointerdown", (e) => {
            if (AppState.selection !== this) {
                AppState.selection_type = "sampler"
                AppState.selection = this;
                for (let s of AppState.samplers) {
                    s.div.style.outline = "none";
                }
                this.div.style.outline = "1px solid black";
                clearInspectorGui();
                this.inspector.show();
            }
            this.trigger();
            e.preventDefault();
        }, {passive: false})

        // potential lifetime issue here
        window.addEventListener("pointerup", (e) => {
            this.release();
            e.preventDefault();
        }, {passive: false})
    }

    trigger() {
        const buffer = AppState.samples[this.sampleId];
        if (!buffer) {
            crash("error in trigger() : missing sample buffer")
            return
        }
        const source = AppState.audioContext.createBufferSource();
        source.buffer = buffer;
        const gainNode = AppState.audioContext.createGain();
        gainNode.gain.value = 0;
        source.connect(gainNode);
        source.playbackRate.value = this.speed;
        gainNode.connect(AppState.audioContext.destination);
        const now = AppState.audioContext.currentTime;
        const attack = this.attack_ms / 1000;
        const decay = this.decay_ms / 1000;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(1, now + attack);
        gainNode.gain.linearRampToValueAtTime(
            this.sustain_vol,
            now + attack + decay
        );

        source.start(0, this.startOffset / 1000);
        this.source = source;
        this.gainNode = gainNode;
        //this.startTime = now;
    }

    release() {
        if (!this.source || !this.gainNode) return;
        const now = AppState.audioContext.currentTime;
        const release = this.release_ms / 1000;
        const currentGain = this.gainNode.gain.value;
        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.setValueAtTime(currentGain, now);
        this.gainNode.gain.linearRampToValueAtTime(0, now + release);
        this.source.stop(now + release + 0.01);
        this.source.onended = () => {
            this.source.disconnect();
            this.gainNode.disconnect();
            this.source = null;
            this.gainNode = null;
        };
    }

    drawWaveform() {

        const buffer = AppState.samples[this.sampleId];
        if (!buffer) crash("drawWaveform fail, missing buffer referenced by sampler")
        const attack_s = this.attack_ms / 1000;
        const decay_s = this.decay_ms / 1000;
        const release_s = this.release_ms / 1000;
        const timespan_s =
            attack_s + decay_s + release_s + 0.05;
        const total = buffer.duration;
        const cropLeft = this.startOffset / 1000 / total;
        const cropRight = Math.min(
            1,
            (this.startOffset / 1000 + timespan_s) / total
        );
        this.div.innerHTML = "";
        this.div.appendChild(drawWaveform(
            buffer,
            75,
            75,
            cropLeft,
            cropRight
        ));
    }
}

class SamplerInspectorGui {

    show() {
        document.getElementById("inspector").appendChild(this.div)
    }

    makeNumber(label, prop, step = 0.01, min, max) {
        const wrap = document.createElement("div");
        wrap.style.display = "flex"
        const input = document.createElement("input");
        input.type = "number";
        input.style.maxWidth = "50px"
        input.step = step;
        const lab = document.createElement("label");
        lab.textContent = label;
        wrap.appendChild(input);
        wrap.appendChild(lab);
        input.oninput = () => {
            let parsedInput = parseFloat(input.value) || 0;
            if (parsedInput < min) {
                input.value = min;
                parsedInput = min;
            }
            else if (parsedInput > max) {
                input.value = max;
                parsedInput = max;
            }

            this.sampler[prop] = parsedInput;
            this.controls.adsrGraph.drawAdsr();
            this.sampler.drawWaveform();
        };
        return { wrap, input };
    }


    constructor(sampler) {

        this.sampler = sampler;
        this.div = document.createElement("div");

        let column1 = document.createElement("div");
        let column2 = document.createElement("div");

        let controls = {};
        controls.adsrGraph = new AdsrGraph(sampler);
        controls.sampleId = this.makeNumber("SAMPLE ID", "sampleId", 1, 0, 999);
        controls.graphView = this.makeNumber("ADSR VIEW MS", "graphLength", 1, 50, 30000)
        controls.startOffset = this.makeNumber("OFFSET MS", "startOffset", 15, 0, 9999999);
        controls.attack = this.makeNumber("ATK MS", "attack_ms", 0, 0, 9999999);
        controls.decay = this.makeNumber("DEC MS", "decay_ms", 0, 0, 9999999);
        controls.sustain = this.makeNumber("SUS LVL", "sustain_vol", 0, 0, 1);
        controls.release = this.makeNumber("REL MS", "release_ms", 0, 0, 9999999);
        controls.speed = this.makeNumber("SPEED", "speed", 0, 0, 50)
        this.controls = controls;



        // append controls to the elements div
        column1.append(
            controls.sampleId.wrap,
            controls.graphView.wrap,
            controls.startOffset.wrap,
            controls.attack.wrap,
            controls.decay.wrap,
            controls.sustain.wrap,
            controls.release.wrap,
            controls.speed.wrap
        )
        let cloneButton = document.createElement("button");
        cloneButton.innerHTML = "clone"
        column2.append(
            controls.adsrGraph.canvas,
            )
        this.div.append(
            column1,
            column2
        )
        this.div.style.display = "flex"

        this.refresh()
    }

    /* gathers all the parameters from */
    refresh() {
        let s = this.sampler;

        let controls = this.controls;

        controls.sampleId.input.value = s.sampleId;
        controls.graphView.input.value = s.graphLength;
        controls.startOffset.input.value = s.startOffset;
        controls.attack.input.value = s.attack_ms;
        controls.decay.input.value = s.decay_ms;
        controls.sustain.input.value = s.sustain_vol;
        controls.release.input.value = s.release_ms;
        controls.speed.input.value = s.speed;

        controls.adsrGraph.drawAdsr();

    }
}


document.getElementById("btn-delsampler")
.addEventListener("pointerdown", (e) => {
    if (AppState.selection_type === "sampler") {
        document.getElementById("samplers-list").removeChild(AppState.selection.div);
        AppState.samplers.splice(AppState.samplers.indexOf(AppState.selection), 1);
        AppState.selection = null;
        AppState.selection_type = null;
        clearInspectorGui();
    }
    e.preventDefault();
}, {passive: false})

document.getElementById("btn-newsampler")
.addEventListener("pointerdown", (e) => {
    new Sampler();
    e.preventDefault()
}, {passive: false})