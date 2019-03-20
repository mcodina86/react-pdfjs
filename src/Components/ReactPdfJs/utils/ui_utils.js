/* eslint-disable no-useless-escape */

/**
 * Returns scale factor for the canvas. It makes sense for the HiDPI displays.
 * @return {Object} The object with horizontal (sx) and vertical (sy)
                    scales. The scaled property is set to false if scaling is
                    not required, true otherwise.

 * @author Mozilla Foundation
 */
export const getOutputScale = ctx => {
  let devicePixelRatio = window.devicePixelRatio || 1;
  let backingStoreRatio =
    ctx.webkitBackingStorePixelRatio ||
    ctx.mozBackingStorePixelRatio ||
    ctx.msBackingStorePixelRatio ||
    ctx.oBackingStorePixelRatio ||
    ctx.backingStorePixelRatio ||
    1;
  let pixelRatio = devicePixelRatio / backingStoreRatio;
  return {
    sx: pixelRatio,
    sy: pixelRatio,
    scaled: pixelRatio !== 1
  };
};

/**
 * Helper function to start monitoring the scroll event and converting them into
 * PDF.js friendly one: with scroll debounce and scroll direction.
 *
 * @author Mozilla Foundation
 */
export const watchScroll = (viewAreaElement, callback) => {
  let debounceScroll = function(evt) {
    if (rAF) {
      return;
    }
    // schedule an invocation of scroll for next animation frame.
    rAF = window.requestAnimationFrame(function viewAreaElementScrolled() {
      rAF = null;

      let currentX = viewAreaElement.scrollLeft;
      let lastX = state.lastX;
      if (currentX !== lastX) {
        state.right = currentX > lastX;
      }
      state.lastX = currentX;
      let currentY = viewAreaElement.scrollTop;
      let lastY = state.lastY;
      if (currentY !== lastY) {
        state.down = currentY > lastY;
      }
      state.lastY = currentY;
      callback(state);
    });
  };

  let state = {
    right: true,
    down: true,
    lastX: viewAreaElement.scrollLeft,
    lastY: viewAreaElement.scrollTop,
    _eventHandler: debounceScroll
  };

  let rAF = null;
  viewAreaElement.addEventListener("scroll", debounceScroll, true);
  return state;
};

/**
 * Helper function to parse query string (e.g. ?param1=value&parm2=...).
 *
 * @author Mozilla Foundation
 */
export const parseQueryString = query => {
  let parts = query.split("&");
  let params = Object.create(null);
  for (let i = 0, ii = parts.length; i < ii; ++i) {
    let param = parts[i].split("=");
    let key = param[0].toLowerCase();
    let value = param.length > 1 ? param[1] : null;
    params[decodeURIComponent(key)] = decodeURIComponent(value);
  }
  return params;
};

/**
 * Use binary search to find the index of the first item in a given array which
 * passes a given condition. The items are expected to be sorted in the sense
 * that if the condition is true for one item in the array, then it is also true
 * for all following items.
 *
 * @returns {Number} Index of the first array element to pass the test,
 *                   or |items.length| if no such element exists.
 *
 * @author Mozilla Foundation
 */
export const binarySearchFirstItem = (items, condition) => {
  let minIndex = 0;
  let maxIndex = items.length - 1;

  if (items.length === 0 || !condition(items[maxIndex])) {
    return items.length;
  }
  if (condition(items[minIndex])) {
    return minIndex;
  }

  while (minIndex < maxIndex) {
    let currentIndex = (minIndex + maxIndex) >> 1;
    let currentItem = items[currentIndex];
    if (condition(currentItem)) {
      maxIndex = currentIndex;
    } else {
      minIndex = currentIndex + 1;
    }
  }
  return minIndex; /* === maxIndex */
};

/**
 *  Approximates float number as a fraction using Farey sequence (max order
 *  of 8).
 *  @param {number} x - Positive float number.
 *  @returns {Array} Estimated fraction: the first array item is a numerator,
 *                   the second one is a denominator.
 *
 * @author Mozilla Foundation
 */
export const approximateFraction = x => {
  // Fast paths for int numbers or their inversions.
  if (Math.floor(x) === x) {
    return [x, 1];
  }
  let xinv = 1 / x;
  let limit = 8;
  if (xinv > limit) {
    return [1, limit];
  } else if (Math.floor(xinv) === xinv) {
    return [1, xinv];
  }

  let x_ = x > 1 ? xinv : x;
  // a/b and c/d are neighbours in Farey sequence.
  let a = 0,
    b = 1,
    c = 1,
    d = 1;
  // Limiting search to order 8.
  while (true) {
    // Generating next term in sequence (order of q).
    let p = a + c,
      q = b + d;
    if (q > limit) {
      break;
    }
    if (x_ <= p / q) {
      c = p;
      d = q;
    } else {
      a = p;
      b = q;
    }
  }
  let result;
  // Select closest of the neighbours to x.
  if (x_ - a / b < c / d - x_) {
    result = x_ === x ? [a, b] : [b, a];
  } else {
    result = x_ === x ? [c, d] : [d, c];
  }
  return result;
};

export const isDataSchema = url => {
  let i = 0,
    ii = url.length;
  while (i < ii && url[i].trim() === "") {
    i++;
  }
  return url.substring(i, i + 5).toLowerCase() === "data:";
};

/**
 * Returns the filename or guessed filename from the url (see issue 3455).
 * @param {string} url - The original PDF location.
 * @param {string} defaultFilename - The value returned if the filename is
 *   unknown, or the protocol is unsupported.
 * @returns {string} Guessed PDF filename.
 * @author Mozilla Foundation
 */
export const getPDFFileNameFromURL = (
  url,
  defaultFilename = "document.pdf"
) => {
  if (typeof url !== "string") {
    return defaultFilename;
  }
  if (isDataSchema(url)) {
    console.warn(
      "getPDFFileNameFromURL: " +
        'ignoring "data:" URL for performance reasons.'
    );
    return defaultFilename;
  }
  const reURI = /^(?:(?:[^:]+:)?\/\/[^\/]+)?([^?#]*)(\?[^#]*)?(#.*)?$/;
  //            SCHEME        HOST         1.PATH  2.QUERY   3.REF
  // Pattern to get last matching NAME.pdf
  const reFilename = /[^\/?#=]+\.pdf\b(?!.*\.pdf\b)/i;
  let splitURI = reURI.exec(url);
  let suggestedFilename =
    reFilename.exec(splitURI[1]) ||
    reFilename.exec(splitURI[2]) ||
    reFilename.exec(splitURI[3]);
  if (suggestedFilename) {
    suggestedFilename = suggestedFilename[0];
    if (suggestedFilename.includes("%")) {
      // URL-encoded %2Fpath%2Fto%2Ffile.pdf should be file.pdf
      try {
        suggestedFilename = reFilename.exec(
          decodeURIComponent(suggestedFilename)
        )[0];
      } catch (ex) {
        // Possible (extremely rare) errors:
        // URIError "Malformed URI", e.g. for "%AA.pdf"
        // TypeError "null has no properties", e.g. for "%2F.pdf"
      }
    }
  }
  return suggestedFilename || defaultFilename;
};

/**
 * Easings functions for animation!
 *
 * @author pawelgrzybek
 */
export const easings = {
  linear(t) {
    return t;
  },
  easeInQuad(t) {
    return t * t;
  },
  easeOutQuad(t) {
    return t * (2 - t);
  },
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  },
  easeInCubic(t) {
    return t * t * t;
  },
  easeOutCubic(t) {
    return --t * t * t + 1;
  },
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  },
  easeInQuart(t) {
    return t * t * t * t;
  },
  easeOutQuart(t) {
    return 1 - --t * t * t * t;
  },
  easeInOutQuart(t) {
    return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
  },
  easeInQuint(t) {
    return t * t * t * t * t;
  },
  easeOutQuint(t) {
    return 1 + --t * t * t * t * t;
  },
  easeInOutQuint(t) {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
  }
};

/**
 * Animate scrollTop! It's used by prev and next page buttons
 *
 * @param {HTMLElement} el
 * @param {number} destination
 * @param {number} headerSize
 * @param {string} easings
 * @param {number} duration
 * @param {function} callback
 *
 * @author pawelgrzybek. Edited.
 */
export const animateIt = (
  el,
  destination,
  headerSize = 0,
  easing = "linear",
  duration = 200,
  callback
) => {
  if ("requestAnimationFrame" in window === false) {
    console.debug("requestAnimationFrame doesn't exists here");
    el.scrollTop = destination - headerSize;
    if (callback) {
      callback();
    }
    return;
  }

  const currentPosition = el.scrollTop;

  const startTime =
    "now" in window.performance ? performance.now() : new Date().getTime();

  function scroll() {
    const now =
      "now" in window.performance ? performance.now() : new Date().getTime();
    const time = Math.min(1, (now - startTime) / duration);
    const timeFunction = easings[easing](time);
    const step = Math.ceil(
      timeFunction * (destination - currentPosition - headerSize) +
        currentPosition
    );
    el.scrollTop = step;

    if (currentPosition + step === currentPosition + destination - headerSize) {
      if (callback) {
        callback();
      }
      return;
    }

    requestAnimationFrame(scroll);
  }

  scroll();
};
