// Keep the original X/Z outline, but face the paving upward. Rotating a Shape
// by +PI/2 preserves Z and reverses its normal; leaving the winding unchanged
// hides the authored floor and exposes the plaster slab underneath.
export function terraceFloorGeometry(T,shape){
 const geometry=new T.ShapeGeometry(shape);
 geometry.rotateX(Math.PI/2);
 const index=geometry.index;
 for(let i=0;i<index.count;i+=3){const b=index.getX(i+1);index.setX(i+1,index.getX(i+2));index.setX(i+2,b);}
 index.needsUpdate=true;geometry.computeVertexNormals();
 return geometry;
}
