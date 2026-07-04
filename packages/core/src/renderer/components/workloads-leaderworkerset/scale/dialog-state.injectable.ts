/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { getInjectable } from "@ogre-tools/injectable";
import { observable } from "mobx";

import type { LeaderWorkerSet } from "@freelensapp/kube-object";

const leaderWorkerSetScaleDialogStateInjectable = getInjectable({
  id: "leaderworkerset-scale-dialog-state",
  instantiate: () => observable.box<LeaderWorkerSet | undefined>(),
});

export default leaderWorkerSetScaleDialogStateInjectable;
