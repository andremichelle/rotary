const LogDb = Math.log(10.0) / 20.0;
export const midiToHz = (note = 60.0, baseFrequency = 440.0) => baseFrequency * Math.pow(2.0, (note + 3.0) / 12.0 - 6.0);
export const dbToGain = db => Math.exp(db * LogDb);
export const gainToDb = gain => Math.log(gain) / LogDb;
export const numFramesToBars = (numFrames, bpm, samplingRate) => (numFrames * bpm) / (samplingRate * 240.0);
export const barsToNumFrames = (bars, bpm, samplingRate) => (bars * samplingRate * 240.0) / bpm;
export const barsToSeconds = (bars, bpm) => (bars * 240.0) / bpm;
//# sourceMappingURL=common.js.map