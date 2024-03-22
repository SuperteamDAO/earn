import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'
import Image from 'next/image'
import React, { useRef, useState } from 'react'

export const ResizableImageExtension = Node.create({
  name: 'imageResizable',

  group: 'block',

  inline: false, 

  atom: true,

  draggable: true,

 addCommands() {
    return {
      setImage: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },

  addAttributes() {
    return {
      src: {default: null}, 
      width: {default: null},
      maxWidth: {default: 100 },
      alt: {default: 'Uploaded image'}
    }
  },

  parseHTML() {
    return [
      {
        tag: 'image-resizable',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['image-resizable', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(Component)
  },
})

const Component =  props => {
  const {src, alt, maxWidth}= props.node.attrs
  const [width, setWidth] = useState<number>(props.node.attrs.width)
  const imageRef = useRef<HTMLImageElement>(null)
  const imageWrapperRef = useRef<HTMLDivElement>(null)
  const resizingRef = useRef<HTMLDivElement>(null)
  const resizingRefH = useRef<HTMLDivElement>(null)
  const [resizable, setResizable] = useState<boolean>(false);
  const [resizableH, setResizableH] = useState<boolean>(false);
  const [resize, setResize] = useState<boolean>(false)

  return (
    <NodeViewWrapper className="react-component">
      <div 
        ref={imageWrapperRef} 
        style={{display: "flex", justifyContent: "center", alignItems: "stretch",  cursor:  resizable ? 'e-resize' : resizableH ? "n-resize" :'default' }}
        onMouseUp={() => {setResize(false); setResizable(false); setResizableH(false)}}
        onMouseLeave={() => {
          setResizable(false); 
          setResize(false)}
        }
        onMouseMove={e => {
          if(!resize) return
          if(resizable) { 
            setWidth(prev => {
              const neWwidth = prev + e.movementX * 2
              if(neWwidth < maxWidth) return maxWidth
              return neWwidth
            })
          } else if (resizableH) { 
              setWidth(prev => {
              const neWwidth = prev + e.movementY * 2
              if(neWwidth < maxWidth) return maxWidth
              return neWwidth
            })
          }
        }}
      >
        <div>
          <Image ref={imageRef} src={src} alt={alt} width={width} height={0}/>
          <div 
            ref={resizingRefH} 
            style={{height: "5px", transform: `translateY(-${2.5}px)`}}  
            onMouseEnter={() => setResizableH(true)}
            onMouseLeave={() => {if(!resize) setResizableH(false)}}
            onMouseDown={() => setResize(true)}
          />
        </div>
        <div 
          ref={resizingRef} 
          style={{width: "5px", transform: `translateX(-${2.5}px)`}}  
          onMouseEnter={() => setResizable(true)}
          onMouseLeave={() => {if(!resize) setResizable(false)}}
          onMouseDown={() => setResize(true)}
        />
      </div>
    </NodeViewWrapper>
  )
}