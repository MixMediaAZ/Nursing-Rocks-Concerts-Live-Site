import React from 'react';
import { EditableElement } from './editable-element';

interface EditableTextProps {
  id?: string | number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  onUpdate?: (newData: any) => void;
}

/**
 * A simple wrapper that makes any text element editable in admin mode
 */
export function EditableText({
  id,
  className,
  style,
  children,
  onUpdate
}: EditableTextProps) {
  // Only apply editable functionality to string content
  const content = typeof children === 'string' ? children : '';
  
  return (
    <EditableElement
      type="text"
      id={id}
      className={className}
      style={style}
      onUpdate={onUpdate}
    >
      {content}
    </EditableElement>
  );
}