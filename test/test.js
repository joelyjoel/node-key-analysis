const Decoder = require("../src/decode2.js")
const MixToMono = require("../src/MixToMono.js")
const Hopper = require("../src/Hopper.js")
const Windower = require("../src/Windower.js")
const FFT = require("../src/FastFourierTransform.js")
const SpectralMagnitudes = require("../src/SpectralMagnitudes.js")
const OffsetWindowSpectrum = require("../src/OffsetWindowSpectrum.js")
const Chromagram = require("../src/Chromagram.js")
const AnalyseChromaData = require("../src/AnalyseChromaData")
const printPitchClass = require("../src/printPitchClass.js")
const ReduceTransients = require("../src/ReduceTransients")

const argv = require("minimist")(process.argv.slice(2))

const audioFile = argv._[0] || "music/sine.wav"

const {Writable} = require("stream")

const sampleRate = 44100
const FFTSize = 4096 * 4
const hopSize = 441
const pitchClasses = [0,1,2,3,4,5,6,7,8,9,10,11]

var dest = new Writable({
  objectMode: true,
})
dest.rootSums = {}
dest._write = async function(chunk, encoding, callback) {
  if(chunk.root != undefined) {
    var i = printPitchClass(chunk.root)
    this.rootSums[i] = (this.rootSums[i] || 0)+1
  }

  callback()
}


var mixtomono = new MixToMono()
var hopper1 = new Hopper(FFTSize, hopSize)
var windower1 = new Windower(FFTSize, "hamming")
//var windowOffset1 = new OffsetWindowSpectrum(FFTSize, "hamming")
var fft1 = new FFT(FFTSize)

var analysis = new AnalyseChromaData(pitchClasses)

var mags = Decoder(audioFile, true)
  //.pipe(dest) /*
  //.pipe(mixtomono)
  .pipe(hopper1)
  .pipe(windower1)
  .pipe(fft1)
//  .pipe(new ReduceTransients(50, sampleRate/hopSize, FFTSize))
  //.pipe(windowOffset1)
  .pipe(new SpectralMagnitudes(FFTSize))
  .pipe(new Chromagram(pitchClasses, FFTSize, sampleRate))
  .pipe(analysis)
  .pipe(dest)
