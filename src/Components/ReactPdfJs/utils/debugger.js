if (typeof performance === "undefined") {
  // eslint-disable-next-line no-unused-vars
  const performance = { now: Date.now };
}

export const startDebug = () => {
  const start = performance.now();
  return start;
};

export const endDebug = (start, message, justTime) => {
  const totalTime = Math.round(performance.now() - start);
  if (justTime) return totalTime;

  let debugMessage = `[REACT-PDFJS] ${message} took ${totalTime}ms`;
  console.debug(debugMessage);
};
