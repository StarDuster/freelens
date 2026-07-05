/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { clusterFrameChildComponentInjectionToken } from "@freelensapp/react-application";
import { getInjectable } from "@ogre-tools/injectable";
import { computed } from "mobx";
import { RoleInstanceSetScaleDialog } from "./dialog";

const roleInstanceSetScaleDialogClusterFrameChildComponentInjectable = getInjectable({
  id: "roleinstanceset-scale-dialog-cluster-frame-child-component",

  instantiate: () => ({
    id: "roleinstanceset-scale-dialog",
    shouldRender: computed(() => true),
    Component: RoleInstanceSetScaleDialog,
  }),

  injectionToken: clusterFrameChildComponentInjectionToken,
});

export default roleInstanceSetScaleDialogClusterFrameChildComponentInjectable;
