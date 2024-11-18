import AdaptiveLabelPositioningBehavior from './AdaptiveLabelPositioningBehavior';
import AppendBehavior from '../../../../common/features/modeling/behavior/AppendBehavior';
import FixHoverBehavior from '../../../../common/features/modeling/behavior/FixHoverBehavior';
import ImportDockingFix from '../../../../common/features/modeling/behavior/ImportDockingFix';
import LabelBehavior from './LabelBehavior';
import UnclaimIdBehavior from './UnclaimIdBehavior';

export default {
    __init__: [
        'adaptiveLabelPositioningBehavior',
        'appendBehavior',
        'fixHoverBehavior',
        'importDockingFix',
        'labelBehavior',
        'unclaimIdBehavior',
    ],
    adaptiveLabelPositioningBehavior: ['type', AdaptiveLabelPositioningBehavior],
    appendBehavior: ['type', AppendBehavior],
    fixHoverBehavior: ['type', FixHoverBehavior],
    importDockingFix: ['type', ImportDockingFix],
    labelBehavior: ['type', LabelBehavior],
    unclaimIdBehavior: ['type', UnclaimIdBehavior],
};
