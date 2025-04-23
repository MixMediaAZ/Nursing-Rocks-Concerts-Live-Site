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
  // Handle various types of content - convert to string when possible
  let content = '';
  if (typeof children === 'string') {
    content = children;
  } else if (typeof children === 'number' || typeof children === 'boolean') {
    content = children.toString();
  } else if (React.isValidElement(children)) {
    // For React elements, try to extract text content
    const childText = React.Children.toArray(children.props.children)
      .filter(child => typeof child === 'string')
      .join(' ');
    content = childText || '[Complex Element]';
  }
  
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