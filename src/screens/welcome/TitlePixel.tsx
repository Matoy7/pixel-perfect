import { TITLE_PIXEL_BOX, boxToPercent } from './layout';
import { asset } from '../../app/asset';
import './title-pixel.css';

/**
 * The small black pixel shape beside the title. Loops a gentle "smoke puff":
 * it drifts up-right on a curve, releases three pixel fragments one after
 * another that float away and fade, then settles back to its exact spot.
 * Pure CSS animation (see title-pixel.css).
 */
export function TitlePixel() {
  return (
    <div className="title-pixel" style={boxToPercent(TITLE_PIXEL_BOX)} aria-hidden="true">
      <div className="title-pixel__x">
        <div className="title-pixel__y">
          <img src={asset('assets/welcome/title-pixel.webp')} alt="" draggable={false} />
        </div>
      </div>
      {/* fragments render above the pixel so they read as breaking off it */}
      <span className="title-pixel__frag title-pixel__frag--1" />
      <span className="title-pixel__frag title-pixel__frag--2" />
      <span className="title-pixel__frag title-pixel__frag--3" />
    </div>
  );
}
