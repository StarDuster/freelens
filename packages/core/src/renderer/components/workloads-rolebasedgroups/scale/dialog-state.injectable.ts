/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { getInjectable } from "@ogre-tools/injectable";
import { observable } from "mobx";

import type { RoleBasedGroup } from "@freelensapp/kube-object";

const roleBasedGroupScaleDialogStateInjectable = getInjectable({
  id: "rolebasedgroup-scale-dialog-state",
  instantiate: () => observable.box<RoleBasedGroup | undefined>(),
});

export default roleBasedGroupScaleDialogStateInjectable;
