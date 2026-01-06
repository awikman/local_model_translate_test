export function log(message, data = null) {
  console.log(`[Translation] ${message}`, data || '');
}

export function warn(message, data = null) {
  console.warn(`[Translation] ${message}`, data || '');
}

export function error(message, data = null) {
  console.error(`[Translation] ${message}`, data || '');
}

export function performance(startMark, endMark) {
  const duration = performance.measure(startMark, endMark).duration;
  console.log(`[Translation] Performance: ${startMark} → ${endMark}: ${duration.toFixed(2)}ms`);
  return duration;
}

export function startTimer(name) {
  const mark = `${name}-start-${Date.now()}`;
  if (typeof performance.mark === 'function') {
    performance.mark(mark);
  } else {
    console.warn('[Logger] performance.mark not available');
  }
  return mark;
}

export function endTimer(name, startMark) {
  const endMark = `${name}-end-${Date.now()}`;
  const startTime = Date.now();
  
  if (typeof performance.mark === 'function' && typeof performance.measure === 'function') {
    try {
      performance.mark(endMark);
      const duration = performance.measure(name, startMark, endMark).duration;
      console.log(`[Translation] ${name}: ${duration.toFixed(2)}ms`);
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      return duration;
    } catch (e) {
      console.warn('[Logger] Performance measurement failed:', e);
    }
  }
  
  // Fallback timing
  const duration = Date.now() - startTime;
  console.log(`[Translation] ${name}: ${duration.toFixed(2)}ms (fallback timing)`);
  return duration;
}
