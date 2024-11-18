import ODRenderer from './ODRenderer';
import TextRenderer from '../../common/draw/TextRenderer';

export default {
    __init__: ['odRenderer'],
    odRenderer: ['type', ODRenderer],
    textRenderer: ['type', TextRenderer],
};
