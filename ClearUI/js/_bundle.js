import valFunctions from './ValFunctions.js';
import { ValError, ValErrorEvent } from './ValError.js';
import { DialogConfigEvent } from './PopupDialog.js';
import ErrorList from './ErrorList.js';
import { nextTock } from './Common.js'; //TypedConfigBase
import { TypedConfigBase } from './TypedConfigBase.js';
import { ActionBtnConfig } from './ActionBtnConfig.js';

const bundle = {
    nextTock,
    vFn:valFunctions,
    ValError,
    ValErrorEvent,
    ErrorList,
    DialogConfigEvent,
    TypedConfigBase,
    ActionBtnConfig,
};

export default bundle