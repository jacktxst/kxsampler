document.getElementById("btn-newsample")
    .addEventListener("click", (e) => {

        const bg_div = document.createElement("div");
        bg_div.id = "bg-div";

        const dialog_div = document.createElement("div");
        dialog_div.id = "dialog-div";
        dialog_div.className = "dialog-box";
        dialog_div.innerHTML = `

		<div class="section-header">
			<div></div> 
			ADD SAMPLE
			<button id="btn-closedialog">X</button>
		</div>
		<div class="dialog-options">
			<button>record</button>
			<button id="btn-import-sample">import</button>
			<button>generate</button>
		</div>
	`
        document.body.appendChild(bg_div)
        document.body.appendChild(dialog_div)

        document.getElementById("btn-import-sample")
            .addEventListener("click", async (e) => {

                try {
                    const audioBuffer = await loadAudioFromUser();
                    AppState.samples.push(audioBuffer);
                    let smpbuf_waveform = drawWaveform(audioBuffer, 75, 75, 0, 1);

                    document.getElementById("samples-list").appendChild(smpbuf_waveform);

                } catch (err) {
                    console.error("Audio load failed:", err);
                }

            })

        document.getElementById("btn-closedialog")
        .addEventListener("click", (e) => {
            document.body.removeChild(bg_div);
            document.body.removeChild(dialog_div);
        }, {passive: false})

    })

async function loadAudioFromUser() {
    return new Promise((resolve, reject) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".wav,.mp3,.m4a,.aac,.ogg,.flac";

        input.onchange = async () => {
            try {
                if (!input.files || !input.files[0]) {
                    reject("No file selected");
                    return;
                }
                const file = input.files[0];
                const arrayBuffer = await file.arrayBuffer();

                const audioBuffer = await AppState.audioContext.decodeAudioData(arrayBuffer);
                resolve(audioBuffer);
            } catch (err) {
                reject(err);
            }
        };
        input.onerror = reject;
        input.click();
    });
}