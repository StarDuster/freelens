/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { getInjectable } from "@ogre-tools/injectable";
import { observable } from "mobx";

import type { RoleInstance } from "@freelensapp/kube-object";

const roleInstanceScaleDialogStateInjectable = getInjectable({
  id: "roleinstance-scale-dialog-state",
  instantiate: () => observable.box<RoleInstance | undefined>(),
});

export default roleInstanceScaleDialogStateInjectable;
