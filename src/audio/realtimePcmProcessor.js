// Downsample microphone audio to 16 kHz mono PCM for the realtime evaluation socket.
// The main thread prefixes each buffer with 0x02 before sending it.
class RealtimePcmProcessor extends AudioWorkletProcessor {
	constructor() {
		super();
		this._samples = [];
		this._fraction = 0;
	}

	process(inputs) {
		const input = inputs[0];
		if (!input || !input[0]) {
			return true;
		}
		const channel = input[0];
		const ratio = sampleRate / 16000;
		for (let index = 0; index < channel.length; index += 1) {
			this._fraction += 1;
			if (this._fraction < ratio) {
				continue;
			}
			this._fraction -= ratio;
			const sample = Math.max(-1, Math.min(1, channel[index]));
			this._samples.push(sample);
		}
		// About 100 ms at 16 kHz.
		if (this._samples.length >= 1600) {
			const chunk = this._samples.splice(0, 1600);
			const pcm = new Int16Array(chunk.length);
			for (let index = 0; index < chunk.length; index += 1) {
				pcm[index] = Math.max(-32768, Math.min(32767, Math.round(chunk[index] * 32767)));
			}
			this.port.postMessage(pcm.buffer, [pcm.buffer]);
		}
		return true;
	}
}

registerProcessor("realtime-pcm-processor", RealtimePcmProcessor);
