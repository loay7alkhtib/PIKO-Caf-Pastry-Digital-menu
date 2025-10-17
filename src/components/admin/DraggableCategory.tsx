import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type { Identifier, XYCoord } from 'dnd-core';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { GripVertical, Edit, Trash2 } from 'lucide-react';
import { Category } from '../../lib/supabase';

interface DraggableCategoryProps {
  category: Category;
  index: number;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

export default function DraggableCategory({
  category,
  index,
  onMove,
  onEdit,
  onDelete,
}: DraggableCategoryProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: Identifier | null }>({
    accept: 'category',
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

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'category',
    item: () => {
      return { id: category.id, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.4 : 1;
  
  drag(drop(ref));

  return (
    <div ref={ref} style={{ opacity }} data-handler-id={handlerId}>
      <Card className="transition-opacity">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
              <GripVertical className="w-5 h-5" />
            </div>
            
            <div className="text-2xl">{category.icon}</div>
            
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{category.names.en}</div>
              <div className="text-sm text-muted-foreground truncate">
                {category.names.tr} • {category.names.ar}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={() => onEdit(category)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => onDelete(category.id)}
                variant="destructive"
                size="sm"
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
