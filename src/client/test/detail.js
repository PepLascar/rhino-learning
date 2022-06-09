const Hls = require('hls.js');

/* eslint-disable no-console */
const players = Array.from(document.querySelectorAll('.plyr-big'));
if (players.length > 0) {
  players.map(video => playVideo(video));
}

function playVideo(video) {
  const source = video.getElementsByTagName('source')[0].src;

  // For more options see: https://github.com/sampotts/plyr/#options
  const defaultOptions = {};

  if (Hls.isSupported()) {
    // For more Hls.js options, see https://github.com/dailymotion/hls.js
    const hls = new Hls({
      xhrSetup: (xhr, url) => {
        xhr.open('POST', url);
        xhr.setRequestHeader('SIMPLECHECK', 'DONTDOWNLOAD');
      }
    });
    hls.loadSource(source);

    // From the m3u8 playlist, hls parses the manifest and returns
    // all available video qualities. This is important, in this approach,
    // we will have one source on the Plyr player.
    hls.on(Hls.Events.MANIFEST_PARSED, function () {

      // Transform available levels into an array of integers (height values).
      const availableQualities = hls.levels.map((l) => l.height);

      // Add new qualities to option
      defaultOptions.quality = {
        default: availableQualities[0],
        options: availableQualities,
        // this ensures Plyr to use Hls to update quality level
        // Ref: https://github.com/sampotts/plyr/blob/master/src/js/html5.js#L77
        forced: true,
        onChange: (e) => updateQuality(e),
      };

      // Initialize new Plyr player with quality options
      new Plyr(video, defaultOptions);
    });
    hls.attachMedia(video);
    window.hls = hls;
  } else {
    // default options with no quality update in case Hls is not supported
    new Plyr(video, defaultOptions);
  }

  function updateQuality(newQuality) {
    window.hls.levels.forEach((level, levelIndex) => {
      if (level.height === newQuality) {
        console.log('Found quality match with ' + newQuality);
        window.hls.currentLevel = levelIndex;
      }
    });
  }
}
