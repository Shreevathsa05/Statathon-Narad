import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useGraph, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows, OrbitControls, Html } from '@react-three/drei';
import { Loader2 } from 'lucide-react';
import { SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';

export default function AvatarCanvas({ isTalking = false, audioIntensity = 0 }) {
  return (
    <div className="w-full h-full relative bg-surface">
      <Canvas camera={{ position: [0, 1.35, 0.90], fov: 35 }}>
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          enableRotate={false}
          target={[0, 1.30, 0]}
        />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="city" />
        
        <Suspense fallback={
          <Html center>
            <div className="flex flex-col items-center gap-3 text-geist-blue bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-border">
              <Loader2 className="w-10 h-10 animate-spin" />
              <p className="font-semibold whitespace-nowrap">Loading Avatar Engine...</p>
            </div>
          </Html>
        }>
          <Model isTalking={isTalking} audioIntensity={audioIntensity} position={[0, -0.15, 0]} />
        </Suspense>
        
        <ContactShadows position={[0, -1.2, 0]} opacity={0.4} scale={5} blur={2} far={4} />
      </Canvas>
    </div>
  );
}

function Model({ isTalking, audioIntensity, ...props }) {
  const { scene } = useGLTF('/models/free_cartoon_game_man_character_rigged.glb');
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  
  const group = useRef();
  const headRef = useRef();
  const headInitialRot = useRef(new THREE.Euler());
  const jawRef = useRef();
  const jawInitialRot = useRef(new THREE.Euler());
  const tongueRef = useRef();
  const tongueInitialRot = useRef(new THREE.Euler());
  const leftEyeRef = useRef();
  const rightEyeRef = useRef();
  const leftShoulderRef = useRef();
  const rightShoulderRef = useRef();
  const leftArmRef = useRef();
  const leftArmInitialRot = useRef(new THREE.Euler());
  const rightArmRef = useRef();
  const rightArmInitialRot = useRef(new THREE.Euler());
  const leftForearmRef = useRef();
  const leftForearmInitialRot = useRef(new THREE.Euler());
  const rightForearmRef = useRef();
  const rightForearmInitialRot = useRef(new THREE.Euler());
  
  // Find relevant bones
  useMemo(() => {
    clone.traverse((child) => {
      if (child.isBone) {
        const name = child.name.toLowerCase();
        if (name.includes('head')) {
          headRef.current = child;
          headInitialRot.current.copy(child.rotation);
        }
        if (name.includes('jawroot')) {
          jawRef.current = child;
          jawInitialRot.current.copy(child.rotation);
        }
        if (name.includes('tongue01')) {
          tongueRef.current = child;
          tongueInitialRot.current.copy(child.rotation);
        }
        
        // Eyeballs (Model has no eyelids)
        if (name.includes('eye_r')) rightEyeRef.current = child;
        if (name.includes('eye_l')) leftEyeRef.current = child;

        // Arm bones
        if (name === 'cc_base_l_upperarm_050') {
          leftArmRef.current = child;
          leftArmInitialRot.current.copy(child.rotation);
        }
        if (name === 'cc_base_r_upperarm_078') {
          rightArmRef.current = child;
          rightArmInitialRot.current.copy(child.rotation);
        }
        if (name === 'cc_base_l_forearm_051') {
          leftForearmRef.current = child;
          leftForearmInitialRot.current.copy(child.rotation);
        }
        if (name === 'cc_base_r_forearm_079') {
          rightForearmRef.current = child;
          rightForearmInitialRot.current.copy(child.rotation);
        }
      }
    });
  }, [clone]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Procedural Breathing (Idle)
    if (group.current) {
      group.current.position.y = props.position[1] + Math.sin(t * 2) * 0.005;
    }
    
    // Procedural Talking
    if (isTalking && headRef.current) {
      // Slow, subtle head movement relative to initial
      headRef.current.rotation.x = headInitialRot.current.x + Math.sin(t * 2) * 0.03;
      headRef.current.rotation.y = headInitialRot.current.y + Math.sin(t * 1.5) * 0.04;
      headRef.current.rotation.z = headInitialRot.current.z + Math.sin(t * 1) * 0.02;
    } else if (headRef.current) {
      // Reset head
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, headInitialRot.current.x, 0.05);
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, headInitialRot.current.y, 0.05);
      headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, headInitialRot.current.z, 0.05);
    }

    // Jaw & Tongue sync (Mouth mimics audio intensity)
    if (jawRef.current) {
      const targetJawRotation = isTalking ? jawInitialRot.current.z + (audioIntensity * 0.4) : jawInitialRot.current.z;
      jawRef.current.rotation.z = THREE.MathUtils.lerp(jawRef.current.rotation.z, targetJawRotation, 0.3);
    }
    
    if (tongueRef.current) {
      const targetTongueRotationZ = isTalking ? tongueInitialRot.current.z + (audioIntensity * 0.2 * Math.sin(t * 15)) : tongueInitialRot.current.z;
      tongueRef.current.rotation.z = THREE.MathUtils.lerp(tongueRef.current.rotation.z, targetTongueRotationZ, 0.4);
    }

    // Drop arms from T-pose to standing pose
    if (leftArmRef.current) {
      leftArmRef.current.rotation.z = leftArmInitialRot.current.z - 0.85; // Relax arms further
      leftArmRef.current.rotation.y = leftArmInitialRot.current.y;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.z = rightArmInitialRot.current.z + 0.85; 
      rightArmRef.current.rotation.y = rightArmInitialRot.current.y;
    }
    if (leftForearmRef.current) {
      leftForearmRef.current.rotation.x = leftForearmInitialRot.current.x - 0.2; // Relax elbow slightly
    }
    if (rightForearmRef.current) {
      rightForearmRef.current.rotation.x = rightForearmInitialRot.current.x - 0.2; // Relax elbow slightly
    }
  });

  return (
    <group ref={group} {...props} dispose={null}>
      <group scale={0.01}>
        <primitive object={nodes._rootJoint} />
        <skinnedMesh geometry={nodes.Object_7.geometry} material={materials.Std_Tongue} skeleton={nodes.Object_7.skeleton} />
        <skinnedMesh geometry={nodes.Object_9.geometry} material={materials.Std_Skin_Head} skeleton={nodes.Object_9.skeleton} />
        <skinnedMesh geometry={nodes.Object_10.geometry} material={materials.Std_Skin_Body} skeleton={nodes.Object_10.skeleton} />
        <skinnedMesh geometry={nodes.Object_11.geometry} material={materials.Std_Skin_Arm} skeleton={nodes.Object_11.skeleton} />
        <skinnedMesh geometry={nodes.Object_12.geometry} material={materials.Std_Skin_Leg} skeleton={nodes.Object_12.skeleton} />
        <skinnedMesh geometry={nodes.Object_13.geometry} material={materials.Std_Nails} skeleton={nodes.Object_13.skeleton} />
        <skinnedMesh geometry={nodes.Object_14.geometry} material={materials.Std_Eyelash} skeleton={nodes.Object_14.skeleton} />
        <skinnedMesh geometry={nodes.Object_16.geometry} material={materials.Std_Upper_Teeth} skeleton={nodes.Object_16.skeleton} />
        <skinnedMesh geometry={nodes.Object_17.geometry} material={materials.Std_Lower_Teeth} skeleton={nodes.Object_17.skeleton} />
        <skinnedMesh geometry={nodes.Object_19.geometry} material={materials.Std_Eye_R} skeleton={nodes.Object_19.skeleton} />
        <skinnedMesh geometry={nodes.Object_20.geometry} material={materials.Std_Cornea_R} skeleton={nodes.Object_20.skeleton} />
        <skinnedMesh geometry={nodes.Object_21.geometry} material={materials.Std_Eye_L} skeleton={nodes.Object_21.skeleton} />
        <skinnedMesh geometry={nodes.Object_22.geometry} material={materials.Std_Cornea_L} skeleton={nodes.Object_22.skeleton} />
        <skinnedMesh geometry={nodes.Object_24.geometry} material={materials.lambert3SG} skeleton={nodes.Object_24.skeleton} />
        <skinnedMesh geometry={nodes.Object_26.geometry} material={materials.lambert4} skeleton={nodes.Object_26.skeleton} />
        <skinnedMesh geometry={nodes.Object_27.geometry} material={materials.lambert5} skeleton={nodes.Object_27.skeleton} />
        <skinnedMesh geometry={nodes.Object_29.geometry} material={materials.Laces} skeleton={nodes.Object_29.skeleton} />
        <skinnedMesh geometry={nodes.Object_30.geometry} material={materials.BackShoe} skeleton={nodes.Object_30.skeleton} />
        <skinnedMesh geometry={nodes.Object_31.geometry} material={materials.FrontShoe} skeleton={nodes.Object_31.skeleton} />
        <skinnedMesh geometry={nodes.Object_32.geometry} material={materials.Sole} skeleton={nodes.Object_32.skeleton} />
        <skinnedMesh geometry={nodes.Object_34.geometry} material={materials.Classic_Taper_Scalp} skeleton={nodes.Object_34.skeleton} />
        <skinnedMesh geometry={nodes.Object_35.geometry} material={materials.Classic_Taper} skeleton={nodes.Object_35.skeleton} />
      </group>
    </group>
  );
}

useGLTF.preload('/models/free_cartoon_game_man_character_rigged.glb');
