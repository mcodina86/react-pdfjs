const perf = window.performance || { now: Date.now };

export const debugFunction = (fx, message, debug = true) => {
  if (!debug) return fx();

  const start = perf.now();
  const result = fx();
  const totalTime = Math.round(performance.now() - start);
  let debugMessage = `[REACT-PDFJS] ${message} took ${totalTime}ms`;
  console.debug(debugMessage);

  return result;
};

export const startDebug = () => {
  return perf.now();
};

export const endDebug = (start, message, justTime) => {
  const totalTime = Math.round(perf.now() - start);
  if (justTime) return totalTime;

  let debugMessage = `[REACT-PDFJS] ${message} took ${totalTime}ms`;
  console.debug(debugMessage);
};
