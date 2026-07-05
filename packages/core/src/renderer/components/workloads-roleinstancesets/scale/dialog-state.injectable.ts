/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { getInjectable } from "@ogre-tools/injectable";
import { observable } from "mobx";

import type { RoleInstanceSet } from "@freelensapp/kube-object";

const roleInstanceSetScaleDialogStateInjectable = getInjectable({
  id: "roleinstanceset-scale-dialog-state",
  instantiate: () => observable.box<RoleInstanceSet | undefined>(),
});

export default roleInstanceSetScaleDialogStateInjectable;
