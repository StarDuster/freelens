/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { getInjectable } from "@ogre-tools/injectable";
import roleInstanceScaleDialogStateInjectable from "./dialog-state.injectable";

import type { RoleInstance } from "@freelensapp/kube-object";

export type OpenRoleInstanceScaleDialog = (obj: RoleInstance) => void;

const openRoleInstanceScaleDialogInjectable = getInjectable({
  id: "open-roleinstance-scale-dialog",
  instantiate: (di): OpenRoleInstanceScaleDialog => {
    const state = di.inject(roleInstanceScaleDialogStateInjectable);

    return (obj) => state.set(obj);
  },
});

export default openRoleInstanceScaleDialogInjectable;
