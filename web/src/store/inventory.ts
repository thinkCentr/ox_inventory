import { createSlice, current, isFulfilled, isPending, isRejected, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '.';
import {
  moveSlotsReducer,
  refreshSlotsReducer,
  setupInventoryReducer,
  stackSlotsReducer,
  swapSlotsReducer,
} from '../reducers';
import { createEmptyInventory, Inventory, Slot, State } from '../typings';

const initialState: State = {
  leftInventory: createEmptyInventory(),
  rightInventory: createEmptyInventory(),
  backpackInventory: createEmptyInventory(),
  containerInventory: createEmptyInventory(),
  ignitionInventory: createEmptyInventory(),
  ecuInventory: createEmptyInventory(),
  additionalMetadata: new Array(),
  itemAmount: 0,
  shiftPressed: false,
  isBusy: false,
};

export const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    stackSlots: stackSlotsReducer,
    swapSlots: swapSlotsReducer,
    setupInventory: setupInventoryReducer,
    moveSlots: moveSlotsReducer,
    refreshSlots: refreshSlotsReducer,
    setAdditionalMetadata: (state, action: PayloadAction<Array<{ metadata: string; value: string }>>) => {
      const metadata = [];

      for (let i = 0; i < action.payload.length; i++) {
        const entry = action.payload[i];
        if (!state.additionalMetadata.find((el) => el.value === entry.value)) metadata.push(entry);
      }

      state.additionalMetadata = [...state.additionalMetadata, ...metadata];
    },
    setItemAmount: (state, action: PayloadAction<number>) => {
      state.itemAmount = action.payload;
    },
    setShiftPressed: (state, action: PayloadAction<boolean>) => {
      state.shiftPressed = action.payload;
    },
    setContainerInventory: (state, action: PayloadAction<Inventory | null | undefined>) => {
      const payload = action.payload;

      if (!payload) {
        if (state.containerInventory.id !== '') state.containerInventory = createEmptyInventory();
        return;
      }

      state.containerInventory = {
        ...payload,
        items: Array.from(Array(payload.slots), (_, index) => {
          const item = Object.values(payload.items).find((entry) => entry?.slot === index + 1);

          return item || { slot: index + 1 };
        }),
      };
    },
    setIgnitionInventory: (state, action: PayloadAction<Inventory | null | undefined>) => {
      const payload = action.payload;

      if (!payload) {
        if (state.ignitionInventory.id !== '') state.ignitionInventory = createEmptyInventory();
        return;
      }

      state.ignitionInventory = {
        ...payload,
        items: Array.from(Array(payload.slots), (_, index) => {
          const item = Object.values(payload.items).find((entry) => entry?.slot === index + 1);

          return item || { slot: index + 1 };
        }),
      };
    },
    setEcuInventory: (state, action: PayloadAction<Inventory | null | undefined>) => {
      const payload = action.payload;
      if (!payload) {
        if (state.ecuInventory.id !== '') state.ecuInventory = createEmptyInventory();
        return;
      }
      state.ecuInventory = {
        ...payload,
        items: Array.from(Array(payload.slots), (_, index) => {
          const item = Object.values(payload.items).find((entry) => entry?.slot === index + 1);
          return item || { slot: index + 1 };
        }),
      };
    },
    setContainerWeight: (state, action: PayloadAction<number>) => {
      const container = state.leftInventory.items.find((item) => item.metadata?.container === state.rightInventory.id);

      if (!container) return;

      container.weight = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(isPending, (state) => {
      state.isBusy = true;

      state.history = {
        leftInventory: current(state.leftInventory),
        rightInventory: current(state.rightInventory),
        backpackInventory: current(state.backpackInventory),
        containerInventory: current(state.containerInventory),
        ignitionInventory: current(state.ignitionInventory),
        ecuInventory: current(state.ecuInventory),
      };
    });
    builder.addMatcher(isFulfilled, (state) => {
      state.isBusy = false;
    });
    builder.addMatcher(isRejected, (state) => {
      if (
        state.history &&
        state.history.leftInventory &&
        state.history.rightInventory &&
        state.history.backpackInventory &&
        state.history.containerInventory &&
        state.history.ignitionInventory &&
        state.history.ecuInventory
      ) {
        state.leftInventory = state.history.leftInventory;
        state.rightInventory = state.history.rightInventory;
        state.backpackInventory = state.history.backpackInventory;
        state.containerInventory = state.history.containerInventory;
        state.ignitionInventory = state.history.ignitionInventory;
        state.ecuInventory = state.history.ecuInventory;
      }
      state.isBusy = false;
    });
  },
});

export const {
  setAdditionalMetadata,
  setItemAmount,
  setShiftPressed,
  setupInventory,
  swapSlots,
  moveSlots,
  stackSlots,
  refreshSlots,
  setContainerWeight,
  setContainerInventory,
  setIgnitionInventory,
  setEcuInventory,
} = inventorySlice.actions;
export const selectLeftInventory = (state: RootState) => state.inventory.leftInventory;
export const selectRightInventory = (state: RootState) => state.inventory.rightInventory;
export const selectBackpackInventory = (state: RootState) => state.inventory.backpackInventory;
export const hasBackpack = (state: RootState) => state.inventory.backpackInventory.id !== '';
export const selectContainerInventory = (state: RootState) => state.inventory.containerInventory;
export const selectIgnitionInventory = (state: RootState) => state.inventory.ignitionInventory;
export const selectEcuInventory = (state: RootState) => state.inventory.ecuInventory;
export const selectItemAmount = (state: RootState) => state.inventory.itemAmount;
export const selectIsBusy = (state: RootState) => state.inventory.isBusy;

export default inventorySlice.reducer;
