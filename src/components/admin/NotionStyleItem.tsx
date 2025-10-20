import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import { useDrag, useDrop } from 'react-dnd';
import type { Identifier, XYCoord } from 'dnd-core';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Category, Item } from '../../lib/supabase';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Edit3, GripVertical, Save, Trash2, X } from 'lucide-react';

interface NotionStyleItemProps {
  item: Item;
  index: number;
  categories: Category[];
  onMove: (
    _dragIndex: number,
    _hoverIndex: number,
    _dragItem?: Item,
    _hoverItem?: Item
  ) => void;
  onUpdate: (_itemId: string, _updates: Partial<Item>) => void;
  onDelete: (id: string) => void;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
  categoryId: string;
  order: number;
}

export default function NotionStyleItem({
  item,
  index,
  categories,
  onMove: _onMove,
  onUpdate: _onUpdate,
  onDelete,
}: NotionStyleItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    order: item.order || 0,
    price: item.price,
    categoryId: item.category_id || '',
    isAvailable: item.is_available ?? true,
  });

  const ref = useRef<HTMLDivElement>(null);
  const lastHoverTime = useRef<number>(0);

  const [{ handlerId, isOver, canDrop }, drop] = useDrop<
    DragItem,
    void,
    {
      handlerId: Identifier | null;
      isOver: boolean;
      canDrop: boolean;
    }
  >({
    accept: 'item',
    collect(monitor: any) {
      return {
        handlerId: monitor.getHandlerId(),
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      };
    },
    canDrop(dragItem: DragItem) {
      return dragItem.id !== item.id;
    },
    hover(dragItem: DragItem, monitor: any) {
      if (!ref.current) {
        return;
      }

      const _dragIndex = dragItem.index;
      const _hoverIndex = index;

      // Throttle hover events
      const now = Date.now();
      if (now - lastHoverTime.current < 100) {
        return;
      }
      lastHoverTime.current = now;

      if (dragItem.id === item.id || dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      // Dragging downwards
      if (_dragIndex < _hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (_dragIndex > _hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      const draggedItem = {
        id: dragItem.id,
        names: { en: dragItem.name || 'Unknown' },
        category_id: dragItem.categoryId,
        order: dragItem.order,
      };

      _onMove(_dragIndex, _hoverIndex, draggedItem, item);
      dragItem.index = _hoverIndex;
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
        name: item.names?.en,
        image: item.image,
      };
      return dragItem;
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.4 : 1;
  const dragRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dragRef.current) {
      drag(dragRef);
    }
    if (ref.current) {
      drop(ref);
    }
  }, [drag, drop, item.id]);

  const category = categories.find(c => c.id === item.category_id);

  const handleEdit = () => {
    setEditValues({
      order: item.order || 0,
      price: item.price,
      categoryId: item.category_id || '',
      isAvailable: item.is_available ?? true,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    _onUpdate(item.id, editValues);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValues({
      order: item.order || 0,
      price: item.price,
      categoryId: item.category_id || '',
      isAvailable: item.is_available ?? true,
    });
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div
      ref={ref}
      style={{ opacity }}
      data-handler-id={handlerId}
      className={`group flex items-center gap-4 p-4 hover:bg-muted/50 transition-all duration-200 ${
        isOver && canDrop
          ? 'bg-blue-50 border-l-4 border-l-blue-500'
          : isOver
            ? 'bg-red-50 border-l-4 border-l-red-500'
            : ''
      }`}
    >
      {/* Drag Handle */}
      <div
        ref={dragRef}
        className={`cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-all duration-200 p-1 rounded ${
          isDragging
            ? 'bg-blue-100 text-blue-600 scale-110'
            : 'hover:bg-gray-100 hover:text-gray-700'
        }`}
        title='Drag to reorder'
      >
        <GripVertical className='w-4 h-4' />
      </div>

      {/* Image */}
      <div className='w-12 h-12 flex-shrink-0'>
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
      </div>

      {/* Item Info */}
      <div className='flex-1 min-w-0'>
        <div className='font-medium text-sm'>{item.names.en}</div>
        <div className='text-xs text-muted-foreground truncate'>
          {item.names.tr}
        </div>
      </div>

      {/* Editable Fields */}
      <div className='flex items-center gap-4'>
        {/* Order */}
        <div className='w-16'>
          {isEditing ? (
            <Input
              type='number'
              value={editValues.order}
              onChange={e =>
                setEditValues(prev => ({
                  ...prev,
                  order: parseInt(e.target.value) || 0,
                }))
              }
              onKeyDown={handleKeyDown}
              className='h-8 text-xs'
            />
          ) : (
            <div className='text-sm font-mono text-muted-foreground'>
              #{item.order ?? 0}
            </div>
          )}
        </div>

        {/* Price */}
        <div className='w-20'>
          {isEditing ? (
            <Input
              type='number'
              step='0.01'
              value={editValues.price}
              onChange={e =>
                setEditValues(prev => ({
                  ...prev,
                  price: parseFloat(e.target.value) || 0,
                }))
              }
              onKeyDown={handleKeyDown}
              className='h-8 text-xs'
            />
          ) : (
            <div className='text-sm font-medium'>{item.price} TL</div>
          )}
        </div>

        {/* Category */}
        <div className='w-32'>
          {isEditing ? (
            <Select
              value={editValues.categoryId}
              onValueChange={value =>
                setEditValues(prev => ({ ...prev, categoryId: value }))
              }
            >
              <SelectTrigger className='h-8 text-xs'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.names.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant='outline' className='text-xs'>
              {category?.icon} {category?.names.en}
            </Badge>
          )}
        </div>

        {/* Available */}
        <div className='w-20'>
          {isEditing ? (
            <Switch
              checked={editValues.isAvailable}
              onCheckedChange={checked =>
                setEditValues(prev => ({ ...prev, isAvailable: checked }))
              }
            />
          ) : (
            <Badge
              variant={item.is_available !== false ? 'default' : 'secondary'}
              className='text-xs'
            >
              {item.is_available !== false ? 'Available' : 'Unavailable'}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className='flex items-center gap-1'>
          {isEditing ? (
            <>
              <Button
                onClick={handleSave}
                size='sm'
                variant='ghost'
                className='h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50'
              >
                <Save className='w-3 h-3' />
              </Button>
              <Button
                onClick={handleCancel}
                size='sm'
                variant='ghost'
                className='h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50'
              >
                <X className='w-3 h-3' />
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleEdit}
                size='sm'
                variant='ghost'
                className='h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity'
              >
                <Edit3 className='w-3 h-3' />
              </Button>
              <Button
                onClick={() => onDelete(item.id)}
                size='sm'
                variant='ghost'
                className='h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity'
              >
                <Trash2 className='w-3 h-3' />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
