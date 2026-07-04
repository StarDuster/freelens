/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { getInjectable } from "@ogre-tools/injectable";
import leaderWorkerSetScaleDialogStateInjectable from "./dialog-state.injectable";

import type { LeaderWorkerSet } from "@freelensapp/kube-object";

export type OpenLeaderWorkerSetScaleDialog = (obj: LeaderWorkerSet) => void;

const openLeaderWorkerSetScaleDialogInjectable = getInjectable({
  id: "open-leaderworkerset-scale-dialog",
  instantiate: (di): OpenLeaderWorkerSetScaleDialog => {
    const state = di.inject(leaderWorkerSetScaleDialogStateInjectable);

    return (obj) => state.set(obj);
  },
});

export default openLeaderWorkerSetScaleDialogInjectable;
