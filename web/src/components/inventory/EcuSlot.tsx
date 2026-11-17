import React, { useCallback, useMemo, useRef } from 'react';
import { useDrag, useDragDropManager, useDrop } from 'react-dnd';
import { useAppDispatch, useAppSelector } from '../../store';
import { selectEcuInventory } from '../../store/inventory';
import { DragSource, InventoryType, Slot, SlotWithItem } from '../../typings';
import { getItemUrl, isSlotWithItem } from '../../helpers';
import { onDrop } from '../../dnd/onDrop';
import useNuiEvent from '../../hooks/useNuiEvent';
import { ItemsPayload } from '../../reducers/refreshSlots';
import { closeTooltip, openTooltip } from '../../store/tooltip';
import { Locale } from '../../store/locale';
import { getBooleanPref } from '../../store/preferences';
import { EcuIcon } from '../utils/icons';
import ItemImage from '../utils/ItemImage';

// Only the ECU programmer is accepted; the server checks the vehicle-bound port.
const ECU_ITEMS = new Set(['ecu_programmer']);
const ECU_SLOT = 1;

/** The driver's ECU/OBD port: accepts the electronic programmer. */
const EcuSlot: React.FC = () => {
  const manager = useDragDropManager();
  const dispatch = useAppDispatch();
  const timerRef = useRef<number | null>(null);
  const ecu = useAppSelector(selectEcuInventory);

  const item = useMemo<Slot>(() => ecu.items[ECU_SLOT - 1] ?? { slot: ECU_SLOT }, [ecu.items]);
  const canDrag = useCallback(() => isSlotWithItem(item), [item]);

  const [{ isDragging }, drag] = useDrag<DragSource, void, { isDragging: boolean }>(
    () => ({
      type: 'SLOT',
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
      item: () =>
        isSlotWithItem(item)
          ? {
              inventory: InventoryType.ECU,
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
        onDrop(source, { inventory: InventoryType.ECU, item: { slot: ECU_SLOT } });
      },
      canDrop: (source) =>
        !isSlotWithItem(item) && source.inventory === InventoryType.PLAYER &&
        ECU_ITEMS.has(source.item.name),
    }),
    [dispatch, item]
  );

  useNuiEvent('refreshSlots', (data: { items?: ItemsPayload | ItemsPayload[] }) => {
    if (!isDragging || !Array.isArray(data.items)) return;
    if (!data.items.some((entry) => entry.inventory === InventoryType.ECU)) return;

    manager.dispatch({ type: 'dnd-core/END_DRAG' });
  });

  if (ecu.id === '') return null;

  const isEmpty = !isSlotWithItem(item);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    dispatch(closeTooltip());
    if (timerRef.current) clearTimeout(timerRef.current);

    // Ctrl-click pulls the tool back into the player's inventory, like any other panel.
    if (event.ctrlKey && isSlotWithItem(item)) onDrop({ item, inventory: InventoryType.ECU });
  };

  const handleMouseEnter = () => {
    if (!isSlotWithItem(item) || !getBooleanPref('showTooltips')) return;

    timerRef.current = window.setTimeout(() => {
      dispatch(openTooltip({ item, inventoryType: InventoryType.ECU }));
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
    'ecu-slot',
    isEmpty ? 'cloth-empty' : '',
    isOver ? (canDrop ? 'cloth-drop-valid' : 'cloth-drop-invalid') : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="ecu">
      <div
        ref={(element) => drag(drop(element))}
        className={className}
        style={{ opacity: isDragging ? 0.4 : undefined }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {isEmpty ? (
          <EcuIcon className="cloth-icon" />
        ) : (
          <ItemImage className="cloth-image" src={getItemUrl(item as SlotWithItem)} />
        )}
      </div>
      <div className="ecu-label">{Locale.ui_ecu || 'ECU / OBD'}</div>
    </div>
  );
};

export default React.memo(EcuSlot);
