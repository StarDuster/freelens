/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { getInjectable } from "@ogre-tools/injectable";
import roleBasedGroupScaleDialogStateInjectable from "./dialog-state.injectable";

import type { RoleBasedGroup } from "@freelensapp/kube-object";

export type OpenRoleBasedGroupScaleDialog = (obj: RoleBasedGroup) => void;

const openRoleBasedGroupScaleDialogInjectable = getInjectable({
  id: "open-rolebasedgroup-scale-dialog",
  instantiate: (di): OpenRoleBasedGroupScaleDialog => {
    const state = di.inject(roleBasedGroupScaleDialogStateInjectable);

    return (obj) => state.set(obj);
  },
});

export default openRoleBasedGroupScaleDialogInjectable;
