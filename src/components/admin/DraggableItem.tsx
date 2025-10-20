import { useLayoutEffect, useRef } from 'react';
// @ts-ignore
import { useDrag, useDrop } from 'react-dnd';
import type { Identifier, XYCoord } from 'dnd-core';
import { TableCell, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, GripVertical, Trash2 } from 'lucide-react';
import { Category, Item } from '../../lib/supabase';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface DraggableItemProps {
  item: Item;
  index: number;
  categories: Category[];
  onMove: (_dragIndex: number, _hoverIndex: number) => void;
  onEdit: (_item: Item) => void;
  onDelete: (_id: string) => void;
}

interface DragItem {
  id: string;
  index: number;
  categoryId: string;
  order: number;
  type: string;
}

export default function DraggableItem({
  item,
  index,
  categories,
  onMove,
  onEdit,
  onDelete,
}: DraggableItemProps) {
  const ref = useRef<HTMLTableRowElement>(null);

  const [{ handlerId }, drop] = useDrop<
    DragItem,
    void,
    { handlerId: Identifier | null }
  >({
    accept: 'item',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      console.log('🔄 Hover event:', {
        dragIndex,
        hoverIndex,
        dragItem: item.id,
        hoverItem: item.id,
        sameItem: dragIndex === hoverIndex,
      });

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        console.log('⚠️ Same item, skipping');
        return;
      }

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        console.log('⚠️ Same position, skipping');
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      console.log('✅ Calling onMove with:', { dragIndex, hoverIndex });
      onMove(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'item',
    item: () => {
      const dragItem = {
        id: item.id,
        index,
        categoryId: item.category_id,
        order: item.order,
      };
      console.log('🎯 Drag started for item:', {
        id: item.id,
        name: item.names?.en,
        index,
        categoryId: item.category_id,
      });
      console.log('🚀 DRAG BEGIN - Item is being dragged!');
      return dragItem;
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      console.log('🏁 DRAG END - Item drag ended!');
      if (!monitor.didDrop()) {
        console.log('⚠️ Drag was cancelled');
      }
    },
  });

  const opacity = isDragging ? 0.4 : 1;

  // Use useLayoutEffect for proper ref attachment timing
  useLayoutEffect(() => {
    drag(drop(ref));
  }, [drag, drop]);

  const category = categories.find(c => c.id === item.category_id);

  return (
    <TableRow
      ref={ref}
      style={{ opacity }}
      data-handler-id={handlerId}
      className='transition-opacity'
    >
      <TableCell className='w-8'>
        <div
          className={`cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground ${
            isDragging ? 'bg-blue-100' : ''
          }`}
          style={{
            backgroundColor: isDragging ? '#dbeafe' : 'transparent',
            border: isDragging ? '2px solid #3b82f6' : 'none',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '40px',
          }}
          title='Drag to reorder'
          onClick={() => {
            console.log('🖱️ CLICKED on drag handle for item:', item.names?.en);
          }}
          onMouseDown={() => {
            console.log(
              '🖱️ MOUSE DOWN on drag handle for item:',
              item.names?.en
            );
          }}
        >
          <GripVertical className='w-5 h-5' />
        </div>
      </TableCell>
      <TableCell className='w-16'>
        {item.image ? (
          <ImageWithFallback
            src={item.image}
            alt={item.names.en}
            className='w-12 h-12 rounded object-cover'
          />
        ) : (
          <div className='w-12 h-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground'>
            No img
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className='font-medium'>{item.names.en}</div>
        <div className='text-xs text-muted-foreground truncate max-w-[200px]'>
          {item.names.tr}
        </div>
      </TableCell>
      <TableCell className='hidden md:table-cell'>
        <div className='text-sm truncate max-w-[150px]'>{item.names.ar}</div>
      </TableCell>
      <TableCell className='font-medium'>{item.price} TL</TableCell>
      <TableCell className='hidden lg:table-cell'>
        {category && (
          <Badge variant='outline'>
            {category.icon} {category.names.en}
          </Badge>
        )}
      </TableCell>
      <TableCell className='hidden xl:table-cell'>
        <div className='flex gap-1 flex-wrap max-w-[200px]'>
          {item.tags?.map(tag => (
            <Badge key={tag} variant='secondary' className='text-xs'>
              {tag}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell className='hidden lg:table-cell'>
        <Badge
          variant={item.is_available !== false ? 'default' : 'secondary'}
          className='text-xs'
        >
          {item.is_available !== false ? '✓ Available' : '✗ Unavailable'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className='flex items-center gap-2'>
          <Button onClick={() => onEdit(item)} variant='outline' size='sm'>
            <Edit className='w-4 h-4' />
          </Button>
          <Button
            onClick={() => onDelete(item.id)}
            variant='destructive'
            size='sm'
          >
            <Trash2 className='w-4 h-4' />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
