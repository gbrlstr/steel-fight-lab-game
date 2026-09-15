import {PerspectiveCamera} from 'three'


// Frame the entire legal arena once per viewport. Movement never changes lens or distance.
export const CAMERA={fov:38,baseZ:13.2,planeZ:4.15,frontMargin:1.3,halfWidth:8.5}
export function cameraTarget(aspect:number){
 const halfWidth=CAMERA.halfWidth
 const distance=halfWidth*1.08/(Math.tan(CAMERA.fov*Math.PI/360)*Math.max(.35,aspect))
 return {center:0,z:Math.max(CAMERA.baseZ,CAMERA.planeZ+CAMERA.frontMargin+distance)}
}
export function frameFight(camera:PerspectiveCamera){
 const {z}=cameraTarget(camera.aspect)
 const scale=(z-CAMERA.planeZ)/(CAMERA.baseZ-CAMERA.planeZ)
 camera.position.set(0,2.55*scale,z)
 camera.lookAt(0,2.05*scale,0)
 camera.updateMatrixWorld()
}


