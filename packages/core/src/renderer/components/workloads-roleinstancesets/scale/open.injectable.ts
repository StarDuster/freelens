/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { getInjectable } from "@ogre-tools/injectable";
import roleInstanceSetScaleDialogStateInjectable from "./dialog-state.injectable";

import type { RoleInstanceSet } from "@freelensapp/kube-object";

export type OpenRoleInstanceSetScaleDialog = (obj: RoleInstanceSet) => void;

const openRoleInstanceSetScaleDialogInjectable = getInjectable({
  id: "open-roleinstanceset-scale-dialog",
  instantiate: (di): OpenRoleInstanceSetScaleDialog => {
    const state = di.inject(roleInstanceSetScaleDialogStateInjectable);

    return (obj) => state.set(obj);
  },
});

export default openRoleInstanceSetScaleDialogInjectable;
