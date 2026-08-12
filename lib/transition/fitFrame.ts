/**
 * How a 16:9 transition frame is placed inside an arbitrary viewport.
 *
 * THE PROBLEM THIS SOLVES
 * The frames are 1280x720. A plain "cover" fit (scale = max(vw/iw, vh/ih))
 * looks right on a laptop and is destroyed on a phone: at 390x844 the cover
 * scale is 1.172, so the frame is drawn 1500x844 and only 390px of its 1500px
 * width is on screen. The viewer sees 26% of the picture, centre-cropped —
 * which is why the animation "shows a portion" on mobile.
 *
 * THE RULE
 * Scale to cover, but never crop away more than MAX_CROP of the frame. Below
 * that ceiling this is exactly the old behaviour; past it the frame is allowed
 * to letterbox against the overlay's dark background instead of being gutted.
 *
 *   scale = min(coverScale, containScale * MAX_CROP_FACTOR)
 *
 * Worked examples (frame 1280x720):
 *   1366x900  laptop    -> cover 1.250, cap 1.333 -> 1.250  full-bleed, unchanged
 *   844x390   phone LS  -> cover 0.659, cap 0.678 -> 0.659  full-bleed
 *   390x844   phone PT  -> cover 1.172, cap 0.381 -> 0.381  80% of width visible
 *   820x1180  tablet PT -> cover 1.639, cap 0.800 -> 0.800  80% of width visible
 *
 * One formula, no mode branching, and it degrades continuously as the viewport
 * gets narrower rather than snapping between two looks.
 */

/**
 * Maximum upscale past a contain fit. 1.25 permits cropping ~20% of the frame's
 * larger dimension — enough to stay full-bleed on any landscape-ish screen,
 * while a portrait phone letterboxes rather than showing a quarter of the shot.
 */
export const MAX_CROP_FACTOR = 1.25;

export interface FrameFit {
  /** Destination width in CSS pixels. */
  dw: number;
  /** Destination height in CSS pixels. */
  dh: number;
  /** Destination x offset (negative when cropping horizontally). */
  dx: number;
  /** Destination y offset (negative when cropping vertically). */
  dy: number;
  /** Applied scale factor. */
  scale: number;
  /** True when the frame fills the viewport with no letterboxing. */
  fullBleed: boolean;
}

/**
 * Returns the destination rect for drawing a frame, centred.
 * Returns null when either dimension is zero (image not decoded yet).
 */
export function computeFrameFit(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number
): FrameFit | null {
  if (!imageWidth || !imageHeight || !viewportWidth || !viewportHeight) return null;

  const coverScale = Math.max(viewportWidth / imageWidth, viewportHeight / imageHeight);
  const containScale = Math.min(viewportWidth / imageWidth, viewportHeight / imageHeight);

  const scale = Math.min(coverScale, containScale * MAX_CROP_FACTOR);

  const dw = imageWidth * scale;
  const dh = imageHeight * scale;

  return {
    dw,
    dh,
    dx: (viewportWidth - dw) / 2,
    dy: (viewportHeight - dh) / 2,
    scale,
    // Allow a sub-pixel tolerance so a rounding error is not reported as a gap.
    fullBleed: dw >= viewportWidth - 0.5 && dh >= viewportHeight - 0.5,
  };
}
