// Keep the integer pixel treatment, while bounding full-screen fill on large
// displays. CSS size and input coordinates remain at the actual viewport size.
export function drawingBufferSize(width,height) {
  const w=Math.max(1,width),h=Math.max(1,height);
  const factor=Math.min(1,1600/Math.max(w,h),Math.sqrt(1600000/(w*h)));
  return [Math.max(1,Math.floor(w*factor)),Math.max(1,Math.floor(h*factor))];
}
