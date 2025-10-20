import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TableCell, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, GripVertical, Trash2 } from 'lucide-react';
import { Category, Item } from '../../lib/supabase';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface DraggableItemProps {
  item: Item;
  categories: Category[];
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
  isDisabled?: boolean;
}

export default function DraggableItemModern({
  item,
  categories,
  onEdit,
  onDelete,
  isDisabled = false,
}: DraggableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: isDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const category = categories.find(c => c.id === item.category_id);

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={`transition-opacity ${isDragging ? 'z-50' : ''}`}
    >
      <TableCell className='w-8'>
        <div
          {...attributes}
          {...listeners}
          className={`${
            isDisabled
              ? 'cursor-not-allowed opacity-50'
              : 'cursor-grab active:cursor-grabbing hover:bg-gray-100'
          } text-muted-foreground p-2 rounded transition-colors`}
          title={
            isDisabled ? 'Reordering disabled in "All" view' : 'Drag to reorder'
          }
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
