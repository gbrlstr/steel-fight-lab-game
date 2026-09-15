import * as T from 'three'

export const HERO_LAYER = 1
export const FX_LAYER = 3

const WIDTH = 0.4
const STRENGTH = 0.3

export function tagHero(root: T.Object3D) {
    root.traverse(o => o.layers.enable(HERO_LAYER))
}

export function tagFx(root: T.Object3D) {
    root.traverse(o => o.layers.set(FX_LAYER))
}

export function heroOutline(renderer: T.WebGLRenderer) {
    const target = new T.WebGLRenderTarget(1, 1)
    target.depthTexture = new T.DepthTexture(1, 1)
    target.depthTexture.format = T.DepthFormat
    target.depthTexture.type = T.UnsignedIntType
    const normals = new T.WebGLRenderTarget(1, 1)
    const normalMaterial = new T.MeshNormalMaterial()
    const resolution = new T.Vector2(1, 1)
    const material = new T.ShaderMaterial({
        uniforms: {
            tDepth: { value: target.depthTexture },
            tNormal: { value: normals.texture },
            resolution: { value: resolution },
            cameraNear: { value: 0.1 },
            cameraFar: { value: 200 },
            ink: { value: new T.Vector3(0.05, 0.05, 0.07) },
            width: { value: WIDTH },
            strength: { value: STRENGTH },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
        vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }`,
        fragmentShader: `
            varying vec2 vUv;
            uniform sampler2D tDepth;
            uniform sampler2D tNormal;
            uniform vec2 resolution;
            uniform float cameraNear;
            uniform float cameraFar;
            uniform vec3 ink;
            uniform float width;
            uniform float strength;
            float eye(float d){
                float z=d*2.0-1.0;
                return (2.0*cameraNear*cameraFar)/(cameraFar+cameraNear-z*(cameraFar-cameraNear));
            }
            void main(){
                float center=texture2D(tDepth,vUv).x;
                float solid=center<0.9999?1.0:0.0;
                vec2 texel=1.0/resolution;
                float stroke=max(3.2,width*9.0);
                float detail=max(1.2,stroke*0.38);
                float silhouette=0.0;
                float crease=0.0;
                vec3 n=texture2D(tNormal,vUv).xyz*2.0-1.0;
                float z0=eye(center);
                for(int i=0;i<8;i++){
                    float a=float(i)*0.785398163;
                    vec2 dir=vec2(cos(a),sin(a));
                    vec2 uvS=vUv+dir*texel*stroke;
                    vec2 uvD=vUv+dir*texel*detail;
                    float ds=texture2D(tDepth,uvS).x;
                    float dd=texture2D(tDepth,uvD).x;
                    float solidS=ds<0.9999?1.0:0.0;
                    float solidD=dd<0.9999?1.0:0.0;
                    silhouette=max(silhouette,abs(solid-solidS));
                    if(solid>0.5 && solidD>0.5){
                        if(abs(z0-eye(dd))>0.45) crease=1.0;
                        vec3 nn=texture2D(tNormal,uvD).xyz*2.0-1.0;
                        if(dot(n,nn)<0.12) crease=1.0;
                    }
                }
                float onEdge=max((1.0-solid)*silhouette, solid*max(silhouette, crease));
                if(onEdge*strength<0.5) discard;
                gl_FragColor=vec4(ink,1.0);
            }
        `,
    })
    const scene = new T.Scene()
    const camera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    scene.add(new T.Mesh(new T.PlaneGeometry(2, 2), material))
    const heroCamera = new T.PerspectiveCamera()
    heroCamera.layers.set(HERO_LAYER)
    return {
        resize() {
            const drawing = renderer.getDrawingBufferSize(resolution)
            if (target.width === drawing.x && target.height === drawing.y) return
            target.setSize(drawing.x, drawing.y)
            normals.setSize(drawing.x, drawing.y)
            material.uniforms.tDepth.value = target.depthTexture
            material.uniforms.tNormal.value = normals.texture
        },
        draw(actors: T.Scene, view: T.PerspectiveCamera) {
            this.resize()
            heroCamera.copy(view)
            heroCamera.layers.set(HERO_LAYER)
            material.uniforms.cameraNear.value = view.near
            material.uniforms.cameraFar.value = view.far
            const previous = renderer.getRenderTarget()
            const clear = renderer.getClearColor(new T.Color())
            const alpha = renderer.getClearAlpha()
            const override = actors.overrideMaterial
            renderer.setRenderTarget(target)
            renderer.setClearColor(0x000000, 0)
            renderer.clear(true, true, true)
            renderer.render(actors, heroCamera)
            actors.overrideMaterial = normalMaterial
            renderer.setRenderTarget(normals)
            renderer.clear(true, true, true)
            renderer.render(actors, heroCamera)
            actors.overrideMaterial = override
            renderer.setRenderTarget(previous)
            renderer.setClearColor(clear, alpha)
            renderer.render(scene, camera)
        },
        dispose() {
            target.dispose()
            target.depthTexture?.dispose()
            normals.dispose()
            normalMaterial.dispose()
            material.dispose()
        },
    }
}
