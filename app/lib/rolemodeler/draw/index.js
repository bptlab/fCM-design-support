import ROMRenderer from './ROMRenderer';
import TextRenderer from '../../common/draw/TextRenderer';

export default {
    __init__: ['romRenderer'],
    romRenderer: ['type', ROMRenderer],
    textRenderer: ['type', TextRenderer],
};
