const Decode = require("./Decode2.js")
const Hopper = require("./Hopper")
const Windower = require("./Windower")
const FFT = require("./FastFourierTransform")
const SpectralMagnitudes = require("./SpectralMagnitudes")
const Chromagram = require("./Chromagram")
const ReduceTransients = require("./ReduceTransients.js")
const Krumhansl = require("./Krumhansl")
const AnalyseKrumhanslData = require("./AnalyseKrumhanslData")

async function estimateKey(options) {
  options = Object.assign({
    fftsize: 4096,
    hopSize: 111,
    windowType: "hamming",
    sampleRate: 11000,

    // chroma test frame settings
    nOctaves: 8,
    nHarmonics: 1,

    pitchClasses: [0,1,2,3,4,5,6,7,8,9,10,11],

    decoderProgressBar: true,
  }, options)

  if(!options.file)
    throw "no input file"

  var decodeStream = Decode(options.file, options.decoderProgressBar, options.sampleRate)
  var chromagramStream = decodeStream
    .pipe(new Hopper(options.fftsize, options.hopSize))
    .pipe(new Windower(options.fftsize, options.windowType))
    .pipe(new FFT(options.fftsize))
    //.pipe(new ReduceTransients(5, options.sampleRate/options.hopSize, options.fftsize*2))
    .pipe(new SpectralMagnitudes(options.fftsize))
    .pipe(new Chromagram(options.pitchClasses, options.fftsize, options.sampleRate, options.nOctaves, options.nHarmonics))

  var analyser = new AnalyseKrumhanslData
  chromagramStream.pipe(new Krumhansl).pipe(analyser)

  return await new Promise((fulfil, reject) => {
    analyser.on("finish", () => {
      var winningScaleID = -1
      var winningScore = 0
      for(var i in analyser.totals)
        if(analyser.totals[i] > winningScore) {
          winningScore = analyser.totals[i]
          winningScaleID = parseInt(i)
        }

      var root = winningScaleID < 12 ? winningScaleID : winningScaleID - 12
      var mode = winningScaleID < 12 ? "major" : "minor"
      fulfil({
        key: root,
        mode: mode,
        scaleID: winningScaleID,
      })
    })
  })

}
module.exports = estimateKey
