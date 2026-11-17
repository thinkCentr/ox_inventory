import React, { useCallback, useMemo, useRef } from 'react';
import { useDrag, useDragDropManager, useDrop } from 'react-dnd';
import { useAppDispatch, useAppSelector } from '../../store';
import { selectIgnitionInventory } from '../../store/inventory';
import { DragSource, InventoryType, Slot, SlotWithItem } from '../../typings';
import { getItemUrl, isSlotWithItem } from '../../helpers';
import { onDrop } from '../../dnd/onDrop';
import useNuiEvent from '../../hooks/useNuiEvent';
import { ItemsPayload } from '../../reducers/refreshSlots';
import { closeTooltip, openTooltip } from '../../store/tooltip';
import { Locale } from '../../store/locale';
import { getBooleanPref } from '../../store/preferences';
import { KeyIcon } from '../utils/icons';
import ItemImage from '../utils/ItemImage';

// The server validates the exact vehicle ID, bound pick and security revision.
const CONTACT_ITEMS = new Set(['vehicle_key', 'lockpick', 'advancedlockpick']);
const IGNITION_SLOT = 1;

/** The driver's Contact: accepts a matching physical key or a mechanical bypass tool. */
const IgnitionSlot: React.FC = () => {
  const manager = useDragDropManager();
  const dispatch = useAppDispatch();
  const timerRef = useRef<number | null>(null);
  const ignition = useAppSelector(selectIgnitionInventory);

  const item = useMemo<Slot>(() => ignition.items[IGNITION_SLOT - 1] ?? { slot: IGNITION_SLOT }, [ignition.items]);
  const canDrag = useCallback(() => isSlotWithItem(item), [item]);

  const [{ isDragging }, drag] = useDrag<DragSource, void, { isDragging: boolean }>(
    () => ({
      type: 'SLOT',
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
      item: () =>
        isSlotWithItem(item)
          ? {
              inventory: InventoryType.IGNITION,
              item: { name: item.name, slot: item.slot },
              image: `url(${getItemUrl(item) || 'none'}`,
            }
          : null,
      canDrag,
    }),
    [item, canDrag]
  );

  const [{ isOver, canDrop }, drop] = useDrop<DragSource, void, { isOver: boolean; canDrop: boolean }>(
    () => ({
      accept: 'SLOT',
      collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
      drop: (source) => {
        dispatch(closeTooltip());
        onDrop(source, { inventory: InventoryType.IGNITION, item: { slot: IGNITION_SLOT } });
      },
      canDrop: (source) =>
        !isSlotWithItem(item) && source.inventory === InventoryType.PLAYER &&
        CONTACT_ITEMS.has(source.item.name),
    }),
    [dispatch, item]
  );

  useNuiEvent('refreshSlots', (data: { items?: ItemsPayload | ItemsPayload[] }) => {
    if (!isDragging || !Array.isArray(data.items)) return;
    if (!data.items.some((entry) => entry.inventory === InventoryType.IGNITION)) return;

    manager.dispatch({ type: 'dnd-core/END_DRAG' });
  });

  if (ignition.id === '') return null;

  const isEmpty = !isSlotWithItem(item);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    dispatch(closeTooltip());
    if (timerRef.current) clearTimeout(timerRef.current);

    // Ctrl-click pulls the key back into the player's inventory, like any other panel.
    if (event.ctrlKey && isSlotWithItem(item)) onDrop({ item, inventory: InventoryType.IGNITION });
  };

  const handleMouseEnter = () => {
    if (!isSlotWithItem(item) || !getBooleanPref('showTooltips')) return;

    timerRef.current = window.setTimeout(() => {
      dispatch(openTooltip({ item, inventoryType: InventoryType.IGNITION }));
    }, 500) as unknown as number;
  };

  const handleMouseLeave = () => {
    dispatch(closeTooltip());
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const className = [
    'cloth',
    'ignition-slot',
    isEmpty ? 'cloth-empty' : '',
    isOver ? (canDrop ? 'cloth-drop-valid' : 'cloth-drop-invalid') : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="ignition">
      <div
        ref={(element) => drag(drop(element))}
        className={className}
        style={{ opacity: isDragging ? 0.4 : undefined }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {isEmpty ? (
          <KeyIcon className="cloth-icon" />
        ) : (
          <ItemImage className="cloth-image" src={getItemUrl(item as SlotWithItem)} />
        )}
      </div>
      <div className="ignition-label">{Locale.ui_ignition || 'Contact'}</div>
    </div>
  );
};

export default React.memo(IgnitionSlot);
