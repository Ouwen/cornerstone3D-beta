import {
  getEnabledElementByIds,
  VolumeViewport,
  StackViewport,
  utilities as csUtils,
} from '@cornerstonejs/core';
import { BaseTool } from './base';
import { scroll } from '../utilities';
import { PublicToolProps, ToolProps, EventTypes } from '../types';

/**
 * The StackScrollTool is a tool that allows the user to scroll through a
 * stack of images by pressing the mouse click and dragging
 */
class StackScrollTool extends BaseTool {
  static toolName;
  deltaY: number;
  touchDragCallback: (evt: EventTypes.MouseDragEventType) => void;
  mouseDragCallback: (evt: EventTypes.MouseDragEventType) => void;

  constructor(
    toolProps: PublicToolProps = {},
    defaultToolProps: ToolProps = {
      supportedInteractionTypes: ['Mouse', 'Touch'],
      configuration: {
        invert: false,
        debounceIfNotLoaded: true,
      },
    }
  ) {
    super(toolProps, defaultToolProps);
    this.deltaY = 1;

    this.touchDragCallback = this._dragCallback.bind(this);
    this.mouseDragCallback = this._dragCallback.bind(this);
  }

  _dragCallback(evt: EventTypes.MouseDragEventType) {
    const { deltaPoints, viewportId, renderingEngineId } = evt.detail;
    const { viewport } = getEnabledElementByIds(viewportId, renderingEngineId);
    const targetId = this.getTargetId(viewport);
    const { debounceIfNotLoaded } = this.configuration;

    const deltaPointY = deltaPoints.canvas[1];

    let volumeId;
    if (viewport instanceof VolumeViewport) {
      volumeId = targetId.split('volumeId:')[1];
    }

    const pixelsPerImage = this._getPixelPerImage(viewport);
    const deltaY = deltaPointY + this.deltaY;

    if (!pixelsPerImage) {
      return;
    }

    if (Math.abs(deltaY) >= pixelsPerImage) {
      const imageIdIndexOffset = Math.round(deltaY / pixelsPerImage);

      scroll(viewport, {
        delta: imageIdIndexOffset,
        volumeId,
        debounceLoading: debounceIfNotLoaded,
      });

      this.deltaY = deltaY % pixelsPerImage;
    } else {
      this.deltaY = deltaY;
    }
  }

  _getPixelPerImage(viewport) {
    const { element } = viewport;
    const numberOfSlices = this._getNumberOfSlices(viewport);

    // The Math.max here makes it easier to mouseDrag-scroll small or really large image stacks
    return Math.max(2, element.offsetHeight / Math.max(numberOfSlices, 8));
  }

  _getNumberOfSlices(viewport) {
    if (viewport instanceof VolumeViewport) {
      const { numberOfSlices } =
        csUtils.getImageSliceDataForVolumeViewport(viewport);
      return numberOfSlices;
    } else if (viewport instanceof StackViewport) {
      return viewport.getImageIds().length;
    }
  }
}

StackScrollTool.toolName = 'StackScroll';
export default StackScrollTool;
