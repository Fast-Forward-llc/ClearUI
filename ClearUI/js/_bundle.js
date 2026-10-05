import valFunctions from './ValFunctions.js';
import { ValError, ValErrorEvent } from './ValError.js';
import { DialogConfigEvent } from './PopupDialog.js';
import ErrorList from './ErrorList.js';
import { nextTock } from './Common.js'; 

const bundle = {
    nextTock,
    vFn:valFunctions,
    ValError,
    ValErrorEvent,
    ErrorList,
    DialogConfigEvent,
};

export default bundle