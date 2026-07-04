/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { clusterFrameChildComponentInjectionToken } from "@freelensapp/react-application";
import { getInjectable } from "@ogre-tools/injectable";
import { computed } from "mobx";
import { LeaderWorkerSetScaleDialog } from "./dialog";

const leaderWorkerSetScaleDialogClusterFrameChildComponentInjectable = getInjectable({
  id: "leaderworkerset-scale-dialog-cluster-frame-child-component",

  instantiate: () => ({
    id: "leaderworkerset-scale-dialog",
    shouldRender: computed(() => true),
    Component: LeaderWorkerSetScaleDialog,
  }),

  injectionToken: clusterFrameChildComponentInjectionToken,
});

export default leaderWorkerSetScaleDialogClusterFrameChildComponentInjectable;
