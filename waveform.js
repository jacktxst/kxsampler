function drawWaveform(audioBuffer, width, height, crop_left, crop_right) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.touchAction = "none";


    const ctx = canvas.getContext('2d');

    const data = audioBuffer.getChannelData(0); // use first channel
    const totalSamples = data.length;

    // Clamp crop values
    crop_left = Math.max(0, Math.min(1, crop_left));
    crop_right = Math.max(0, Math.min(1, crop_right));

    if (crop_right <= crop_left) {
        ctx.fillStyle = '#ff0000'
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return canvas;
    }

    const startSample = Math.floor(totalSamples * crop_left);
    const endSample = Math.floor(totalSamples * crop_right);

    const visibleSamples = endSample - startSample;
    const samplesPerPixel = visibleSamples / width;

    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'black';

    for (let x = 0; x < width; x++) {
        // diabolical variable naming lmao sampleStart and startSample are we deadass
        const sampleStart = Math.floor(startSample + x * samplesPerPixel);
        const sampleEnd = Math.floor(sampleStart + samplesPerPixel);

        let min = 1.0;
        let max = -1.0;

        for (let i = sampleStart; i < sampleEnd && i < endSample; i++) {
            const v = data[i];
            if (v < min) min = v;
            if (v > max) max = v;
        }

        const y1 = centerY + min * centerY;
        const y2 = centerY + max * centerY;

        ctx.fillRect(x, y1, 1, Math.max(1, y2 - y1));
    }

    return canvas;
}
