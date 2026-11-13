/**
 * Story → tutorial hand-off: one continuous move through the black pixel.
 *
 * 1. The story's last shot keeps zooming into its monitor pixel (drawn as a
 *    crisp #000 square) and carries it to exactly where the jar's pixel will
 *    be, at HANDOFF_SCALE × the jar pixel's resting size.
 * 2. The tutorial mounts underneath already zoomed in by HANDOFF_SCALE on its
 *    own pixel — same spot, same size — and holds while the story fades away
 *    over it (the two black squares are identical, so the pixel never changes).
 * 3. The jar pulls back to rest, emerging around the pixel.
 */
export const HANDOFF_SCALE = 2.6;
export const HANDOFF_ZOOM_MS = 1400; // story: zoom into the pixel
export const HANDOFF_FADE_MS = 400; // story fades out over the (held) jar
export const TUTORIAL_INTRO_MS = 1500; // jar pulls back to rest
