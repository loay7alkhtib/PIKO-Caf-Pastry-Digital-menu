import { useEffect, useRef } from 'react';
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
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
  categoryId: string;
  order: number;
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
  const lastHoverTime = useRef<number>(0);

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
    hover(dragItem: DragItem, monitor) {
      if (!ref.current) {
        return;
      }

      const dragIndex = dragItem.index;
      const hoverIndex = index;

      // Throttle hover events to prevent excessive calls
      const now = Date.now();
      if (now - lastHoverTime.current < 100) {
        return;
      }
      lastHoverTime.current = now;

      // Prevent dragging the same item over itself
      if (dragItem.id === item.id) {
        return;
      }

      // Only allow reordering within the same category
      if (dragItem.categoryId !== item.category_id) {
        return;
      }

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      onMove(dragIndex, hoverIndex);
      // Update the drag item's index to prevent infinite loops
      dragItem.index = hoverIndex;
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
      return dragItem;
    },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.4 : 1;
  const dragRef = useRef<HTMLDivElement>(null);

  // Use useEffect to avoid accessing refs during render
  useEffect(() => {
    if (dragRef.current) {
      drag(dragRef);
    }
    if (ref.current) {
      drop(ref);
    }
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
          ref={dragRef}
          className={`cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground ${
            isDragging ? 'bg-blue-100' : ''
          }`}
          style={{
            backgroundColor: isDragging ? '#dbeafe' : 'transparent',
            border: isDragging ? '2px solid #3b82f6' : 'none',
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
