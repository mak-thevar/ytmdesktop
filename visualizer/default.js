function main(analyser) {
  this.canvasId = "music-canvas";
  this.settings = {};
  this.settings.barCount = 120;

  //Build and append the canvas
  this.buildCanvas = function() {
    this.canvas = !document.getElementById(this.canvasId)
      ? document.createElement("canvas")
      : document.getElementById(this.canvasId);
    this.canvas2D = this.canvas.getContext("2d");
    this.canvas.style.cssText =
      "position:fixed;bottom:0;z-index:999999;width:100%;pointer-events: none;";
    this.canvas.setAttribute("id", this.canvasId);
    this.canvas.setAttribute("width", String(window.innerWidth));
    this.canvas.setAttribute("height", String(window.innerHeight));
    document.body.appendChild(this.canvas);
    this.barWidth2 = this.canvas.width / this.settings.barCount;
  };

  this.buildCanvas();

  this.capYPositionArray = [];

  this.capHeight = 12;

  this.meterStep = 0.8;

  this.array = new Uint8Array(analyser.frequencyBinCount);

  analyser.fftSize = 2048;

  analyser.minDecibels = -90;

  analyser.maxDecibels = 0;

  this.analyser = analyser;

  this.settings.opacity = 1;

  /**
   * Default color and setting for the bar visualizer
   */
  this.settings.bottom = "#C76600";

  this.settings.middle = "#00DE6D";

  this.settings.top = "#0BF0CF";

  this.settings.bar = "#00CFBB";

  this.settings.barHeight = 30;

  this.settings.capsEnabled = true;

  this.render = function() {
    var l = this.canvas2D.createLinearGradient(0, 0, 0, this.canvas.height);
    l.addColorStop(1, this.settings.bottom);
    l.addColorStop(0.7, this.settings.middle);
    l.addColorStop(0, this.settings.top);
    this.canvas2D.globalAlpha = this.settings.opacity;
    /** @type {string} */
    this.canvas.style.height =
      window.innerHeight * (this.settings.barHeight / 100) + "px";
    this.canvas2D.fillStyle = l;
    /** @type {number} */
    this.barWidth2 = this.canvas.width / this.settings.barCount;
  };
  this.render();

  this.drawRect = function(x, y, h) {
    y = this.canvas.height - (y * this.canvas.height) / 255;
    this.canvas2D.fillRect(
      x * (this.barWidth2 + this.meterStep),
      y,
      this.barWidth2 - this.meterStep,
      h
    );
  };

  this.start = function() {
    this.analyser.getByteFrequencyData(this.array);
    this.canvas2D.clearRect(0, 0, this.canvas.width, this.canvas.height);

    var j = 0;
    for (; j < this.settings.barCount; j++) {
      if (this.settings.capsEnabled) {
        this.drawCaps(j);
      }
      this.drawRect(j, this.array[j], this.canvas.height);
    }

    main.call = requestAnimationFrame(this.start.bind(this));
  };

  this.drawCaps = function(i) {
    if (this.array[i] < this.capYPositionArray[i]) {
      this.drawRect(i, --this.capYPositionArray[i], this.capHeight);
    } else {
      this.drawRect(i, this.canvas.height, this.capHeight);
      this.capYPositionArray[i] = this.array[i];
    }
  };
  this.stop = function(allowFailure) {
    this.canvas2D.clearRect(0, 0, this.canvas.width, this.canvas.height);
    cancelAnimationFrame(main.call);
  };
}

function init(size, options, mediaElement) {
  let self = new main(options);
  if (self) {
    mediaElement.addEventListener(
      "pause",
      function() {
        return self.stop("pause");
      },
      false
    );
    mediaElement.addEventListener(
      "suspend",
      function() {
        return self.stop("suspend");
      },
      false
    );
    mediaElement.addEventListener(
      "abort",
      function() {
        return self.stop("abort");
      },
      false
    );
    mediaElement.addEventListener(
      "ended",
      function() {
        return self.stop("ended");
      },
      false
    );
    mediaElement.addEventListener(
      "play",
      function() {
        return self.start();
      },
      false
    );
    if (!audio.paused) {
      self.start();
    }
  }
}

var audio = document.querySelector("video.video-stream");
if (audio && !document.getElementById("music-canvas")) {
  var context = new AudioContext();
  /** @type {!MediaElementAudioSourceNode} */
  var analyser = context.createMediaElementSource(audio);
  /** @type {!AnalyserNode} */
  var data = context.createAnalyser();
  analyser.connect(data);
  analyser.connect(context.destination);
  if (audio.readyState >= audio.HAVE_FUTURE_DATA) {
    init(0, data, audio);
  } else {
    audio.addEventListener(
      "canplay",
      function() {
        init(0, data, audio);
      },
      false
    );
  }
}
