class AdsrGraph {

    constructor(sampler) {
        let canvas = document.createElement('canvas');
        canvas.style.flex = "0 0 auto";
        canvas.width = 200;
        canvas.style.touchAction = "none";
        canvas.height = 120;
        canvas.style.width = "200px";
        canvas.style.height = "120px";
        canvas.style.outline = "1px solid black"
        canvas.className = "adsr-canvas";
        this.ctx = canvas.getContext('2d');
        this.canvas = canvas;
        this.dragIndex = -1;
        this.sampler = sampler;

        this.drawAdsr();

        canvas.addEventListener("pointerdown", e => {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const pts = this._getAdsrPoints()
            const W = canvas.width;
            const H = canvas.height;
            let tx = (t) => { return (t / this.sampler.graphLength) * W; }
            let ty = (v) => { return H - v * H; }
            pts.forEach((p, i) => {
                if (i === 1 || i === 2 || i === 3) {
                    const dx = tx(p.x) - mx;
                    const dy = ty(p.y) - my;
                    if (dx * dx + dy * dy < 100) {
                        this.dragIndex = i;
                    }
                }
            });
            canvas.setPointerCapture(e.pointerId);
        }, {passive: false});
        canvas.addEventListener("pointermove", e => {
            if (this.dragIndex === -1) return;
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const W = canvas.width;
            const H = canvas.height;
            let sampler = this.sampler;
            const t = (mx / W) * sampler.graphLength;
            const v = 1 - my / H;
            if (this.dragIndex === 1) {
                sampler.attack_ms = Math.max(0, t);
            }
            if (this.dragIndex === 2) {
                const atk = sampler.attack_ms;
                sampler.decay_ms = Math.max(0, t - atk);
                sampler.sustain_vol = Math.min(1, Math.max(0, v));
            }
            if (this.dragIndex === 3) {
                const atkDec = sampler.attack_ms + sampler.decay_ms;
                sampler.release_ms = Math.max(0, t - atkDec);
            }
            this.drawAdsr();
            this.sampler.drawWaveform();
            this.sampler.inspector.refresh();
        }, {passive: false});
        window.addEventListener("pointerup", () => {
            this.dragIndex = -1;
        });
    }

    /* _getAdsrPoints(s) : helper function

    given a sampler unit with adsr parameters,
    calculate the xy positions of each point
    on the adsr graph.
    */
    _getAdsrPoints() {
        const x1 = this.sampler.attack_ms;
        const x2 = x1 + this.sampler.decay_ms;
        const x3 = x2 + this.sampler.release_ms;
        return [
            { x: 0,  y: 0 },
            { x: x1, y: 1 },
            { x: x2, y: this.sampler.sustain_vol },
            { x: x3, y: 0 }
        ];
    }

    /* draws the adsr graph according
       to the sampler's adsr properties
     */
    drawAdsr() {
        const pts = this._getAdsrPoints();
        let ctx = this.ctx;
        let canvas = this.canvas;
        const W = canvas.width;
        const H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        let tx = (t) => { return (t / this.sampler.graphLength) * W; }
        let ty = (v) => { return H - v * H;  }
        ctx.beginPath();
        pts.forEach((p, i) => {
            if (i === 0) ctx.moveTo(tx(p.x), ty(p.y));
            else ctx.lineTo(tx(p.x), ty(p.y));
        });
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.stroke();
        pts.forEach((p, i) => {
            const x = tx(p.x);
            const y = ty(p.y);
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.fillStyle = i === 0 || i === pts.length - 1 ? "#f00" : "#00f";
            ctx.fill();
        });
    }
}

